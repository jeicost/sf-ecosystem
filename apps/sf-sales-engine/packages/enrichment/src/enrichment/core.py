import structlog
from enrichment.dedup import deduplicate
from enrichment.models import EnrichedLead, TriggerSignal
from enrichment.retry import with_retry
from enrichment import cache
from scrapers.models import RawLead
from scrapers.apollo import ApolloRateLimitError, ApolloAuthError
from urllib.parse import urlparse
from supabase import AsyncClient

log = structlog.get_logger()


class EnrichmentEngine:
    """
    Orchestrates scraper calls to enrich company and contact data.

    Orchestration flow:
    1. Tavily: general company data, news, trigger signals
    2. Apollo: contact enrichment (email, phone, additional contacts) + caching
    3. Hunter: email verification and discovery + caching
    4. Apify: LinkedIn fallback for deep profile data

    Each step handles gracefully if data is missing or scraper is unavailable.
    Includes caching to avoid duplicate API calls and cost tracking.
    """

    def __init__(
        self,
        scrapers: dict,
        db: AsyncClient | None = None,
        client_id: str | None = None,
    ) -> None:
        """
        Initialize EnrichmentEngine with scraper instances and optional Supabase client.

        Args:
            scrapers: dict with keys 'tavily', 'apollo', 'hunter', 'apify'
                     Values are scraper instances or None if unavailable.
            db: Optional Supabase AsyncClient for caching and usage logging
            client_id: UUID of the client (required if db is provided)
        """
        self.tavily = scrapers.get("tavily")
        self.apollo = scrapers.get("apollo")
        self.hunter = scrapers.get("hunter")
        self.apify = scrapers.get("apify")
        self.db = db
        self.client_id = client_id

        log.info(
            "enrichment.init",
            tavily_available=self.tavily is not None,
            apollo_available=self.apollo is not None,
            hunter_available=self.hunter is not None,
            apify_available=self.apify is not None,
            cache_enabled=self.db is not None,
        )

    async def enrich_batch(self, raw_leads: list[RawLead]) -> tuple[list[EnrichedLead], dict[str, float]]:
        """
        Dedup → enrich with scrapers → return EnrichedLeads ready for scoring.

        Args:
            raw_leads: List of RawLead objects from discovery phase

        Returns:
            Tuple of (list of EnrichedLead objects, dict of estimated_cost_usd by source)
        """
        deduped = deduplicate(raw_leads)
        log.info(
            "enrichment.batch.start",
            total=len(raw_leads),
            after_dedup=len(deduped),
        )

        results: list[EnrichedLead] = []
        costs: dict[str, float] = {"apollo": 0.0, "hunter": 0.0, "tavily": 0.0, "apify": 0.0}

        for idx, lead in enumerate(deduped, start=1):
            enriched, lead_costs = await self.enrich(lead)
            results.append(enriched)
            for source, cost in lead_costs.items():
                costs[source] = costs.get(source, 0.0) + cost
            log.info(
                "enrichment.batch.progress",
                current=idx,
                total=len(deduped),
                email_verified=enriched.email_verified,
                lead_costs=lead_costs,
            )

        log.info(
            "enrichment.batch.complete",
            total=len(results),
            with_verified_email=sum(1 for r in results if r.email_verified),
            with_trigger_signals=sum(1 for r in results if r.trigger_signals),
            total_costs_usd=costs,
        )
        return results, costs

    async def enrich(self, lead: RawLead) -> tuple[EnrichedLead, dict[str, float]]:
        """
        Orchestrate scraper calls for a single lead.

        Execution order:
        1. Tavily: company news + trigger signals
        2. Apollo: additional contacts + email discovery
        3. Hunter: email verification + discovery
        4. Apify: LinkedIn enrichment (fallback if LinkedIn URL available)

        Args:
            lead: RawLead object from discovery

        Returns:
            Tuple of (EnrichedLead with merged data, dict of estimated costs by source)
        """
        log.info(
            "enrichment.lead.start",
            lead_name=f"{lead.first_name} {lead.last_name}".strip(),
            company=lead.company_name,
            source=lead.source,
        )

        enriched = EnrichedLead(
            first_name=lead.first_name,
            last_name=lead.last_name,
            title=lead.title,
            email=lead.email,
            linkedin_url=lead.linkedin_url,
            company_name=lead.company_name,
            company_website=lead.company_website,
            company_size=lead.company_size,
            industry=lead.industry,
            geography=lead.geography,
            sources_used=[lead.source],
            raw_data=lead.raw_data.copy() if lead.raw_data else {},
        )
        costs: dict[str, float] = {}

        # Step 1: Tavily — company news and trigger signals
        if self.tavily and lead.company_name:
            tavily_data = await self._enrich_with_tavily(lead)
            enriched.company_news = tavily_data.get("company_news")
            enriched.trigger_signals.extend(tavily_data.get("trigger_signals", []))
            if "tavily" not in enriched.sources_used:
                enriched.sources_used.append("tavily")
            enriched.raw_data["tavily"] = tavily_data.get("raw", {})
            costs["tavily"] = tavily_data.get("cost_usd", 0.0)

        # Step 2: Apollo — email and phone enrichment
        if self.apollo and lead.company_name:
            apollo_data = await self._enrich_with_apollo(lead)
            enriched.email = apollo_data.get("email") or enriched.email
            if apollo_data.get("phone"):
                enriched.raw_data["phone"] = apollo_data["phone"]
            if "apollo" not in enriched.sources_used:
                enriched.sources_used.append("apollo")
            enriched.raw_data["apollo"] = apollo_data.get("raw", {})
            costs["apollo"] = apollo_data.get("cost_usd", 0.0)

        # Step 3: Hunter — email verification and discovery
        email_to_verify = enriched.email
        if self.hunter and email_to_verify:
            hunter_data = await self._enrich_with_hunter(email_to_verify, enriched.company_website)
            enriched.email = hunter_data.get("email") or enriched.email
            enriched.email_verified = hunter_data.get("verified", False)
            if "hunter" not in enriched.sources_used:
                enriched.sources_used.append("hunter")
            enriched.raw_data["hunter"] = hunter_data.get("raw", {})
            costs["hunter"] = hunter_data.get("cost_usd", 0.0)

        # Step 4: Apify (LinkedIn) — fallback for deep profile enrichment
        if self.apify and enriched.linkedin_url:
            apify_data = await self._enrich_with_apify(enriched.linkedin_url)
            enriched.linkedin_summary = apify_data.get("summary") or enriched.linkedin_summary
            enriched.title = apify_data.get("title") or enriched.title
            if "apify" not in enriched.sources_used:
                enriched.sources_used.append("apify")
            enriched.raw_data["apify"] = apify_data.get("raw", {})
            costs["apify"] = apify_data.get("cost_usd", 0.0)

        log.info(
            "enrichment.lead.complete",
            lead_name=f"{enriched.first_name} {enriched.last_name}".strip(),
            company=enriched.company_name,
            email_verified=enriched.email_verified,
            trigger_signals_count=len(enriched.trigger_signals),
            sources_used=enriched.sources_used,
            costs_usd=costs,
        )
        return enriched, costs

    async def _enrich_with_tavily(self, lead: RawLead) -> dict:
        """
        Fetch company news and extract trigger signals from Tavily.

        Args:
            lead: RawLead object with company_name

        Returns:
            dict with keys: company_news, trigger_signals, raw
        """
        try:
            log.info("enrichment.tavily.start", company=lead.company_name)

            # Search for company news
            news_results = await self.tavily.search_company_news(
                lead.company_name,
                days=30,
            )

            # Extract trigger signals from news
            trigger_signals = []
            company_news_summary = None

            if news_results:
                company_news_summary = " | ".join(
                    [f"{r.get('title', '')} ({r.get('url', '')})" for r in news_results[:3]]
                )

                # Simple signal detection based on keywords
                signal_keywords = {
                    "funding": ["funding", "inversión", "series", "round", "million"],
                    "hiring": ["hiring", "expanding", "contratar", "new office"],
                    "expansion": ["expansion", "new market", "expansion", "abre"],
                    "news": ["news", "announced", "anunció"],
                }

                for signal_type, keywords in signal_keywords.items():
                    for result in news_results:
                        text = (
                            f"{result.get('title', '')} {result.get('content', '')}"
                        ).lower()
                        if any(kw in text for kw in keywords):
                            trigger_signals.append(
                                TriggerSignal(
                                    type=signal_type,
                                    description=result.get("title", "")[:150],
                                    source_url=result.get("url"),
                                )
                            )
                            break

            log.info(
                "enrichment.tavily.complete",
                company=lead.company_name,
                news_found=len(news_results),
                signals_extracted=len(trigger_signals),
            )

            # Log Tavily usage (note: cost per query varies, using 0 for now)
            if self.db and self.client_id:
                await cache.log_usage(
                    self.db,
                    self.client_id,
                    "tavily",
                    records_fetched=len(news_results),
                    api_cost_usd=0.0,  # Tavily cost varies, add tracking if plan available
                )

            return {
                "company_news": company_news_summary,
                "trigger_signals": trigger_signals,
                "raw": {"news_results": news_results},
                "cost_usd": 0.0,
            }

        except NotImplementedError:
            log.info("enrichment.tavily.not_implemented", company=lead.company_name)
            return {"company_news": None, "trigger_signals": [], "raw": {}, "cost_usd": 0.0}
        except Exception as e:
            log.warning(
                "enrichment.tavily.error",
                company=lead.company_name,
                error=str(e),
            )
            return {"company_news": None, "trigger_signals": [], "raw": {}, "cost_usd": 0.0}

    async def _enrich_with_apollo(self, lead: RawLead) -> dict:
        """
        Fetch additional contact data from Apollo by company domain.
        Includes caching to avoid duplicate calls within 7 days.

        Args:
            lead: RawLead object with company data

        Returns:
            dict with keys: email, phone, raw, cost_usd
        """
        if not lead.company_website:
            log.debug("enrichment.apollo.skip_no_domain", company=lead.company_name)
            return {"email": None, "phone": None, "raw": {}, "cost_usd": 0.0}

        try:
            log.info("enrichment.apollo.start", company=lead.company_name, domain=lead.company_website)

            # Extract domain from company_website
            parsed = urlparse(lead.company_website if lead.company_website.startswith("http") else f"https://{lead.company_website}")
            domain = parsed.netloc or lead.company_website

            # Step 1: Check cache before API call
            if self.db:
                cached_data = await cache.get_cached(self.db, domain)
                if cached_data:
                    log.info("enrichment.apollo.cache_hit", domain=domain)
                    return {
                        "email": cached_data.get("email"),
                        "phone": None,
                        "raw": cached_data,
                        "cost_usd": 0.0,  # Cache hit = no API cost
                    }

            # Step 2: Call Apollo API with retry
            async def search_apollo():
                return await self.apollo.search(domain, limit=5)

            results = await with_retry(
                search_apollo,
                retriable_exceptions=(ApolloRateLimitError,),
                max_retries=3,
                base_delay=1.0,
                context={"company": lead.company_name, "domain": domain},
            )

            if not results:
                log.info("enrichment.apollo.no_results", company=lead.company_name, domain=domain)
                # Log usage even for empty result (still used an API call)
                if self.db and self.client_id:
                    await cache.log_usage(
                        self.db,
                        self.client_id,
                        "apollo",
                        records_fetched=0,
                        api_cost_usd=0.015,
                    )
                return {"email": None, "phone": None, "raw": {}, "cost_usd": 0.015}

            # Take first result
            first = results[0]
            log.info(
                "enrichment.apollo.success",
                company=lead.company_name,
                domain=domain,
                found_email=bool(first.get("email")),
            )

            # Step 3: Cache successful result
            if self.db:
                await cache.set_cached(self.db, domain, first, sources=["apollo"])

            # Step 4: Log usage
            if self.db and self.client_id:
                await cache.log_usage(
                    self.db,
                    self.client_id,
                    "apollo",
                    records_fetched=1,
                    api_cost_usd=0.015,
                )

            return {
                "email": first.get("email"),
                "phone": None,  # Apollo doesn't return phone in basic search
                "raw": first,
                "cost_usd": 0.015,  # Apollo charges ~$0.015 per search
            }

        except ApolloAuthError as e:
            log.error("enrichment.apollo.auth_error", company=lead.company_name, error=str(e))
            return {"email": None, "phone": None, "raw": {}, "cost_usd": 0.0}
        except Exception as e:
            log.warning(
                "enrichment.apollo.error",
                company=lead.company_name,
                error=str(e),
            )
            return {"email": None, "phone": None, "raw": {}, "cost_usd": 0.0}

    async def _enrich_with_hunter(self, email: str, domain: str | None) -> dict:
        """
        Verify email and discover additional emails via Hunter.
        Includes usage logging for cost tracking.

        Args:
            email: Email to verify
            domain: Company domain for email discovery

        Returns:
            dict with keys: email, verified, raw, cost_usd
        """
        try:
            log.info("enrichment.hunter.start", email=email, has_domain=bool(domain))

            # Step 1: Verify the email if provided
            verified = False
            raw_data = {}
            api_calls = 0

            if email:
                try:
                    verify_result = await self.hunter.verify_email(email)
                    verified = verify_result.get("valid", False)
                    raw_data = verify_result.get("raw_data", {})
                    api_calls += 1
                    log.info(
                        "enrichment.hunter.verify_complete",
                        email=email,
                        valid=verified,
                        score=verify_result.get("score"),
                    )
                except Exception as e:
                    log.warning("enrichment.hunter.verify_error", email=email, error=str(e))

            # Step 2: Try to discover email by domain if missing or unverified
            if not email or not verified:
                if domain:
                    parsed = urlparse(domain if domain.startswith("http") else f"https://{domain}")
                    domain_only = parsed.netloc or domain
                    try:
                        discovered_email = await self.hunter.find_email_by_domain(domain_only)
                        if discovered_email:
                            email = discovered_email
                            api_calls += 1
                            log.info("enrichment.hunter.email_discovered", email=email, domain=domain_only)
                    except Exception as e:
                        log.warning("enrichment.hunter.discover_error", domain=domain, error=str(e))

            log.info(
                "enrichment.hunter.complete",
                email=email,
                verified=verified,
                api_calls=api_calls,
            )

            # Log usage
            if self.db and self.client_id and api_calls > 0:
                await cache.log_usage(
                    self.db,
                    self.client_id,
                    "hunter",
                    records_fetched=1 if email else 0,
                    api_cost_usd=0.0,  # Hunter free tier
                )

            return {
                "email": email,
                "verified": verified,
                "raw": raw_data,
                "cost_usd": 0.0,  # Hunter has free tier; pricing depends on plan
            }

        except Exception as e:
            log.warning(
                "enrichment.hunter.error",
                email=email,
                error=str(e),
            )
            return {
                "email": email,
                "verified": False,
                "raw": {},
                "cost_usd": 0.0,
            }

    async def _enrich_with_apify(self, linkedin_url: str) -> dict:
        """
        Enrich LinkedIn profile data via Apify.

        Args:
            linkedin_url: LinkedIn profile URL

        Returns:
            dict with keys: summary, title, raw
        """
        try:
            log.info("enrichment.apify.start", linkedin_url=linkedin_url[:50])

            # Apify would scrape LinkedIn profile data
            # For now stub — would call enrich_profile
            log.info("enrichment.apify.not_implemented", linkedin_url=linkedin_url[:50])
            return {"summary": None, "title": None, "raw": {}}

        except NotImplementedError:
            log.info("enrichment.apify.not_implemented", linkedin_url=linkedin_url[:50])
            return {"summary": None, "title": None, "raw": {}, "cost_usd": 0.0}
        except Exception as e:
            log.warning(
                "enrichment.apify.error",
                linkedin_url=linkedin_url[:50],
                error=str(e),
            )
            return {"summary": None, "title": None, "raw": {}, "cost_usd": 0.0}
