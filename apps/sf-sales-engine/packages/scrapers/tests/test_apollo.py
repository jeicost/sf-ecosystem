import pytest
import httpx
import respx
from scrapers.apollo import ApolloScraper, ApolloAuthError, ApolloRateLimitError
from scrapers.models import RawLead, ScraperResult


@pytest.mark.asyncio
async def test_search_success():
    """Test successful company domain search."""
    with respx.mock:
        mock_response = {
            "people": [
                {
                    "email": "john@acme.com",
                    "name": "John Doe",
                    "title": "CEO",
                    "company_name": "ACME Corp",
                    "linkedin_url": "https://linkedin.com/in/johndoe",
                },
                {
                    "email": "jane@acme.com",
                    "name": "Jane Smith",
                    "title": "CTO",
                    "company_name": "ACME Corp",
                    "linkedin_url": "https://linkedin.com/in/janesmith",
                },
            ]
        }

        respx.post("https://api.apollo.io/v1/people/search").mock(
            return_value=httpx.Response(200, json=mock_response)
        )

        scraper = ApolloScraper(api_key="test-key")
        results = await scraper.search("acme.com", limit=2)

        assert len(results) == 2
        assert results[0]["email"] == "john@acme.com"
        assert results[1]["name"] == "Jane Smith"
        assert results[0]["title"] == "CEO"

        await scraper.close()


@pytest.mark.asyncio
async def test_search_auth_error():
    """Test 401 Unauthorized response."""
    with respx.mock:
        respx.post("https://api.apollo.io/v1/people/search").mock(
            return_value=httpx.Response(401)
        )

        scraper = ApolloScraper(api_key="invalid-key")

        with pytest.raises(ApolloAuthError):
            await scraper.search("acme.com")

        await scraper.close()


@pytest.mark.asyncio
async def test_search_rate_limit():
    """Test 429 rate limit response."""
    with respx.mock:
        respx.post("https://api.apollo.io/v1/people/search").mock(
            return_value=httpx.Response(429)
        )

        scraper = ApolloScraper(api_key="test-key")

        with pytest.raises(ApolloRateLimitError):
            await scraper.search("acme.com")

        await scraper.close()


@pytest.mark.asyncio
async def test_search_empty_domain():
    """Test handling of empty domain."""
    scraper = ApolloScraper(api_key="test-key")
    results = await scraper.search("", limit=5)

    assert results == []

    await scraper.close()


@pytest.mark.asyncio
async def test_fetch_leads_success():
    """Test ICP-based lead fetch."""
    with respx.mock:
        mock_response = {
            "prospects": [
                {
                    "first_name": "Alice",
                    "last_name": "Johnson",
                    "email": "alice@techcorp.com",
                    "title": "Engineering Manager",
                    "company_name": "TechCorp",
                    "company_website": "techcorp.com",
                    "company_size": "100-500",
                    "industry": "Software",
                    "state": "California",
                    "country": "USA",
                    "linkedin_url": "https://linkedin.com/in/alicejohnson",
                },
            ]
        }

        respx.post("https://api.apollo.io/v1/prospects/search").mock(
            return_value=httpx.Response(200, json=mock_response)
        )

        scraper = ApolloScraper(api_key="test-key")
        result = await scraper.fetch_leads(
            job_titles=["Engineering Manager"],
            industries=["Software"],
            geographies=["California"],
            company_sizes=["100-500"],
            limit=1,
        )

        assert isinstance(result, ScraperResult)
        assert result.source == "apollo"
        assert len(result.leads) == 1
        assert result.records_fetched == 1
        assert result.error is None

        lead = result.leads[0]
        assert isinstance(lead, RawLead)
        assert lead.email == "alice@techcorp.com"
        assert lead.title == "Engineering Manager"
        assert lead.company_name == "TechCorp"

        await scraper.close()


@pytest.mark.asyncio
async def test_fetch_leads_with_error():
    """Test fetch_leads error handling."""
    with respx.mock:
        respx.post("https://api.apollo.io/v1/prospects/search").mock(
            return_value=httpx.Response(401)
        )

        scraper = ApolloScraper(api_key="invalid-key")
        result = await scraper.fetch_leads(
            job_titles=["CEO"],
            industries=["Tech"],
            geographies=[],
            company_sizes=[],
        )

        assert result.source == "apollo"
        assert len(result.leads) == 0
        assert result.error is not None
        assert "Invalid Apollo API key" in result.error

        await scraper.close()


@pytest.mark.asyncio
async def test_fetch_leads_rate_limit_error():
    """Test fetch_leads rate limit handling."""
    with respx.mock:
        respx.post("https://api.apollo.io/v1/prospects/search").mock(
            return_value=httpx.Response(429)
        )

        scraper = ApolloScraper(api_key="test-key")
        result = await scraper.fetch_leads(
            job_titles=["CTO"],
            industries=["SaaS"],
            geographies=["USA"],
            company_sizes=["50-100"],
        )

        assert result.source == "apollo"
        assert len(result.leads) == 0
        assert result.error is not None
        assert "Rate limit" in result.error

        await scraper.close()
