# Apollo Scraper Implementation

## Overview

Full implementation of `ApolloScraper` with two main methods:
- `search(company_domain, limit)` - Search people by company domain
- `fetch_leads(job_titles, industries, geographies, company_sizes, limit)` - ICP-based prospect search

## Features

- **Async-first**: Uses `httpx.AsyncClient` for non-blocking HTTP calls
- **Error handling**: 
  - `ApolloAuthError` for 401 Unauthorized (invalid API key)
  - `ApolloRateLimitError` for 429 Too Many Requests (rate limit exceeded)
  - Standard `httpx.HTTPError` for other HTTP errors
- **Structured logging**: Uses `structlog` for observability
- **Cost tracking**: Estimates Apollo API costs (~$0.015 per person)
- **Graceful error handling**: `fetch_leads()` returns partial results with error message instead of raising

## API Endpoints

### 1. People Search (by domain)
```
POST /v1/people/search
{
  "domain": "acme.com",
  "per_page": 10,
  "page": 1
}

Response:
{
  "people": [
    {
      "email": "john@acme.com",
      "name": "John Doe",
      "title": "CEO",
      "company_name": "ACME Corp",
      "linkedin_url": "https://linkedin.com/in/johndoe"
    }
  ]
}
```

### 2. Prospects Search (ICP-based)
```
POST /v1/prospects/search
{
  "job_titles": ["CEO", "CTO"],
  "industries": ["Software", "SaaS"],
  "states": ["California", "Texas"],
  "company_size": ["100-500", "500-1000"],
  "per_page": 50,
  "page": 1
}

Response:
{
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
      "linkedin_url": "https://linkedin.com/in/alicejohnson"
    }
  ]
}
```

## Usage Examples

### Basic Setup
```python
import os
from scrapers.apollo import ApolloScraper

# Get API key from environment
api_key = os.getenv("APOLLO_API_KEY")
scraper = ApolloScraper(api_key=api_key)

try:
    # ... use scraper ...
finally:
    await scraper.close()
```

### Search by Company Domain
```python
# Search for people at a specific company
people = await scraper.search(
    company_domain="acme.com",
    limit=5
)

for person in people:
    print(f"{person['name']} ({person['title']}) - {person['email']}")
```

### ICP-Based Lead Search
```python
from scrapers.models import RawLead, ScraperResult

# Search prospects matching ICP criteria
result = await scraper.fetch_leads(
    job_titles=["CEO", "CTO", "VP of Engineering"],
    industries=["Software", "SaaS"],
    geographies=["California", "Texas"],
    company_sizes=["100-500", "500-1000"],
    limit=50
)

# Check for errors
if result.error:
    print(f"Error: {result.error}")
    print(f"Got {len(result.leads)} partial results")
else:
    print(f"Successfully fetched {result.records_fetched} leads")
    print(f"Estimated cost: ${result.estimated_cost_usd:.2f}")

# Process leads
for lead in result.leads:
    if lead.email:
        print(f"{lead.first_name} {lead.last_name}: {lead.email}")
```

### Error Handling
```python
from scrapers.apollo import ApolloAuthError, ApolloRateLimitError

try:
    people = await scraper.search("acme.com", limit=5)
except ApolloAuthError:
    print("Invalid API key. Check APOLLO_API_KEY environment variable")
except ApolloRateLimitError:
    print("Rate limit exceeded. Retry in 60 seconds")
    # Implement backoff/retry logic
except Exception as e:
    print(f"Unexpected error: {e}")
```

## Return Types

### `search()` returns
```python
list[dict]
# Each dict has: {email, name, title, company_name, linkedin_url}
```

### `fetch_leads()` returns
```python
ScraperResult(
    leads: list[RawLead],           # Extracted prospects
    source: str,                    # "apollo"
    records_fetched: int,           # Number of leads fetched
    estimated_cost_usd: float,      # Cost estimate for the search
    error: str | None,              # Error message if any
)
```

## Environment Variables

```bash
export APOLLO_API_KEY="your-api-key-here"
```

## Testing

All functionality is tested with mocked HTTP responses using `respx`:

```bash
cd apps/sf-sales-engine
uv run pytest packages/scrapers/tests/test_apollo.py -v
```

Test coverage:
- ✓ Successful domain search
- ✓ Successful ICP-based lead fetch
- ✓ 401 Authentication error handling
- ✓ 429 Rate limit error handling
- ✓ Empty domain graceful handling
- ✓ Error recovery in `fetch_leads()`
- ✓ Cost estimation

## Integration with SF Sales Engine

The Apollo scraper integrates with:

1. **EnrichmentEngine** (`packages/enrichment/`) - Orchestrates multiple scrapers
2. **Discovery Pipeline** (`scripts/discover_leads.py`) - Main discovery job
3. **FastAPI Server** (`apps/api/`) - Exposes scraping endpoints
4. **Arq Worker** (`apps/worker/`) - Async job queue for discovery runs

## Cost Optimization

- Default `limit` in `search()` is 5 to minimize API calls
- Default `limit` in `fetch_leads()` is 100 for comprehensive ICP searches
- Adjust limits based on your Apollo subscription tier
- Track `estimated_cost_usd` to monitor spending

## Future Enhancements

- Pagination support (currently page 1 only)
- Batch domain searches for efficiency
- Caching layer to avoid duplicate searches
- Async context manager support (`async with` syntax)
