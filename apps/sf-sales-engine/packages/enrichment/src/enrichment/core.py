import structlog
from enrichment.dedup import deduplicate
from enrichment.models import EnrichedLead, TriggerSignal
from scrapers.models import RawLead

log = structlog.get_logger()


class EnrichmentEngine:
    """
    Orchestrates scraper calls to enrich company and contact data.

    Orchestration flow:
    1. Tavily: general company data, news, trigger signals
    2. Apollo: contact enrichment (email, phone, additional contacts)
    3. Hunter: email verification and discovery
    4. Apify: LinkedIn fallback for deep profile data

    Each step handles gracefully if data is missing or scraper is unavailable.
    """

    def __init__(
        self,
        scrapers: dict,
    ) -> None:
        """
        Initialize EnrichmentEngine with scraper instances.

        Args:
            scrapers: dict with keys 'tavily', 'apollo', 'hunter', 'apify'
                     Values are scraper instances or None if unavailable.
        """
        self.tavily = scrapers.get("tavily")
        self.apollo = scrapers.get("apollo")
        self.hunter = scrapers.get("hunter")
        self.apify = scrapers.get("apify")

        log.info(
            "enrichment.init",
            tavily_available=self.tavily is not None,
            apollo_available=self.apollo is not None,
            hunter_available=self.hunter is not None,
            apify_available=self.apify is not None,
        )

    async def enrich_batch(self, raw_leads: list[RawLead]) -> list[EnrichedLead]:
        """
        Dedup → enrich with scrapers → return EnrichedLeads ready for scoring.

        Args:
            raw_leads: List of RawLead objects from discovery phase

        Returns:
            List of EnrichedLead objects with cross-sourced data
        """
        deduped = deduplicate(raw_leads)
        log.info(
            "enrichment.batch.start",
            total=len(raw_leads),
            after_dedup=len(deduped),
        )

        results: list[EnrichedLead] = []
        for idx, lead in enumerate(deduped, start=1):
            enriched = await self.enrich(lead)
            results.append(enriched)
            log.info(
                "enrichment.batch.progress",
                current=idx,
                total=len(deduped),
                email_verified=enriched.email_verified,
            )

        log.info(
            "enrichment.batch.complete",
            total=len(results),
            with_verified_email=sum(1 for r in results if r.email_verified),
            with_trigger_signals=sum(1 for r in results if r.trigger_signals),
        )
        return results

    async def enrich(self, lead: RawLead) -> EnrichedLead:
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
            EnrichedLead with merged data from all available sources
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

        # Step 1: Tavily — company news and trigger signals
        if self.tavily and lead.company_name:
            tavily_data = await self._enrich_with_tavily(lead)
            enriched.company_news = tavily_data.get("company_news")
            enriched.trigger_signals.extend(tavily_data.get("trigger_signals", []))
            if "tavily" not in enriched.sources_used:
                enriched.sources_used.append("tavily")
            enriched.raw_data["tavily"] = tavily_data.get("raw", {})

        # Step 2: Apollo — email and phone enrichment
        if self.apollo and lead.company_name:
            apollo_data = await self._enrich_with_apollo(lead)
            enriched.email = apollo_data.get("email") or enriched.email
            if apollo_data.get("phone"):
                enriched.raw_data["phone"] = apollo_data["phone"]
            if "apollo" not in enriched.sources_used:
                enriched.sources_used.append("apollo")
            enriched.raw_data["apollo"] = apollo_data.get("raw", {})

        # Step 3: Hunter — email verification and discovery
        email_to_verify = enriched.email
        if self.hunter and email_to_verify:
            hunter_data = await self._enrich_with_hunter(email_to_verify, enriched.company_website)
            enriched.email = hunter_data.get("email") or enriched.email
            enriched.email_verified = hunter_data.get("verified", False)
            if "hunter" not in enriched.sources_used:
                enriched.sources_used.append("hunter")
            enriched.raw_data["hunter"] = hunter_data.get("raw", {})

        # Step 4: Apify (LinkedIn) — fallback for deep profile enrichment
        if self.apify and enriched.linkedin_url:
            apify_data = await self._enrich_with_apify(enriched.linkedin_url)
            enriched.linkedin_summary = apify_data.get("summary") or enriched.linkedin_summary
            enriched.title = apify_data.get("title") or enriched.title
            if "apify" not in enriched.sources_used:
                enriched.sources_used.append("apify")
            enriched.raw_data["apify"] = apify_data.get("raw", {})

        log.info(
            "enrichment.lead.complete",
            lead_name=f"{enriched.first_name} {enriched.last_name}".strip(),
            company=enriched.company_name,
            email_verified=enriched.email_verified,
            trigger_signals_count=len(enriched.trigger_signals),
            sources_used=enriched.sources_used,
        )
        return enriched

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

            return {
                "company_news": company_news_summary,
                "trigger_signals": trigger_signals,
                "raw": {"news_results": news_results},
            }

        except NotImplementedError:
            log.info("enrichment.tavily.not_implemented", company=lead.company_name)
            return {"company_news": None, "trigger_signals": [], "raw": {}}
        except Exception as e:
            log.warning(
                "enrichment.tavily.error",
                company=lead.company_name,
                error=str(e),
            )
            return {"company_news": None, "trigger_signals": [], "raw": {}}

    async def _enrich_with_apollo(self, lead: RawLead) -> dict:
        """
        Fetch additional contact data from Apollo.

        Args:
            lead: RawLead object with company data

        Returns:
            dict with keys: email, phone, raw
        """
        try:
            log.info("enrichment.apollo.start", company=lead.company_name)

            # Apollo would search for additional contacts/emails
            # For now stub — would call fetch_leads with ICP filters
            log.info("enrichment.apollo.not_implemented", company=lead.company_name)
            return {"email": None, "phone": None, "raw": {}}

        except NotImplementedError:
            log.info("enrichment.apollo.not_implemented", company=lead.company_name)
            return {"email": None, "phone": None, "raw": {}}
        except Exception as e:
            log.warning(
                "enrichment.apollo.error",
                company=lead.company_name,
                error=str(e),
            )
            return {"email": None, "phone": None, "raw": {}}

    async def _enrich_with_hunter(self, email: str, domain: str | None) -> dict:
        """
        Verify email and discover additional emails via Hunter.

        Args:
            email: Email to verify
            domain: Company domain for email discovery

        Returns:
            dict with keys: email, verified, raw
        """
        try:
            log.info("enrichment.hunter.start", email=email)

            # Hunter would verify email and discover additional contacts
            # For now stub — would call verify_email and find_email
            log.info("enrichment.hunter.not_implemented", email=email)
            return {"email": email, "verified": False, "raw": {}}

        except NotImplementedError:
            log.info("enrichment.hunter.not_implemented", email=email)
            return {"email": email, "verified": False, "raw": {}}
        except Exception as e:
            log.warning(
                "enrichment.hunter.error",
                email=email,
                error=str(e),
            )
            return {"email": email, "verified": False, "raw": {}}

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
            return {"summary": None, "title": None, "raw": {}}
        except Exception as e:
            log.warning(
                "enrichment.apify.error",
                linkedin_url=linkedin_url[:50],
                error=str(e),
            )
            return {"summary": None, "title": None, "raw": {}}
