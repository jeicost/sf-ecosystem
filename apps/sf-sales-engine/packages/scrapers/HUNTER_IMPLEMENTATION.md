# Hunter Scraper Implementation

## Overview

Fully implemented async `HunterScraper` class for email discovery and verification using Hunter.io API.

**File**: `src/scrapers/hunter.py`  
**Tests**: `test_hunter.py`

---

## API Methods

### 1. `verify_email(email: str) -> VerifyResult`

Verifies email validity and extracts comprehensive validation metrics.

**Signature**:
```python
async def verify_email(self, email: str) -> VerifyResult
```

**Returns**: `VerifyResult` TypedDict with:
- `valid: bool` — email is valid
- `score: float` — validity score (0-100)
- `regexp: bool` — passed regex validation
- `mx_records: bool` — MX records exist
- `smtp_server: bool` — SMTP server responds
- `accept_all: bool` — domain accepts all emails
- `disposable: bool` — is disposable/temporary email
- `free_email: bool` — is free email (gmail, yahoo, etc)
- `status: str` — raw status from API ("valid", "invalid", "risky", "rate_limited")
- `raw_data: dict` — full API response data

**Error Handling**:
- **Rate Limit (429)**: Returns safe default with `status: "rate_limited"`, no exception
- **Auth Failure (401)**: Raises `ValueError("Hunter API key inválida o expirada")`
- **HTTP Errors**: Logs and re-raises `httpx.HTTPError`

**Example**:
```python
scraper = HunterScraper(api_key=os.getenv("HUNTER_API_KEY"))
result = await scraper.verify_email("john@company.com")
if result["valid"] and result["score"] > 80:
    print(f"Valid email: {result['status']}")
```

---

### 2. `find_email(domain: str, first_name: str, last_name: str) -> str | None`

Discovers email for a specific person by domain + name.

**Signature**:
```python
async def find_email(self, domain: str, first_name: str, last_name: str) -> str | None
```

**Parameters**:
- `domain: str` — company domain (e.g., "startup.com")
- `first_name: str` — person's first name
- `last_name: str` — person's last name

**Returns**: 
- Email string if found (e.g., "john.doe@startup.com")
- `None` if not found or error

**Error Handling**:
- **Rate Limit (429)**: Returns `None`, logs warning
- **Auth Failure (401)**: Raises `ValueError`
- **Not Found (404)**: Returns `None`, logs at debug level
- **HTTP Errors**: Logs and re-raises

**Example**:
```python
email = await scraper.find_email("startup.com", "John", "Doe")
if email:
    print(f"Found: {email}")
else:
    print("Email not discovered")
```

---

### 3. `find_email_by_domain(company_domain: str) -> str | None`

Simplified variant to discover the main company email contact (CEO, info@, etc).

**Signature**:
```python
async def find_email_by_domain(self, company_domain: str) -> str | None
```

**Parameters**:
- `company_domain: str` — company domain (e.g., "startup.com")

**Returns**: 
- Main company email (e.g., "hello@startup.com")
- `None` if not found or error

**Error Handling**: Same as `find_email()`

**Example**:
```python
email = await scraper.find_email_by_domain("startup.com")
if email:
    print(f"Company contact: {email}")
```

---

### 4. `close() -> None`

Properly closes the underlying `httpx.AsyncClient`.

**Usage**:
```python
scraper = HunterScraper(api_key=api_key)
try:
    result = await scraper.verify_email("test@example.com")
finally:
    await scraper.close()

# Or use as context manager (if context manager added later)
```

---

## Error Handling

### Rate Limit (429)

Hunter API enforces rate limits based on your plan. Instead of raising an exception:

- `verify_email()`: Returns `{"status": "rate_limited", "valid": False, "score": 0.0, ...}`
- `find_email()` / `find_email_by_domain()`: Return `None`

Both log a warning via structlog for monitoring.

### Authentication (401)

If the API key is invalid or expired:
- All methods raise `ValueError("Hunter API key inválida o expirada")`
- Logged as error with `api_key_present` flag

Caller should check environment variables and credentials:
```python
api_key = os.getenv("HUNTER_API_KEY")
if not api_key:
    raise ValueError("HUNTER_API_KEY not set")
```

### HTTP Errors

Generic httpx errors (connection timeouts, 5xx, etc.) are:
1. Logged with full context (method, domain, name, error)
2. Re-raised to caller for handling

Timeout is set to 15 seconds.

---

## Configuration

### Environment Variables

```bash
export HUNTER_API_KEY="your-api-key-here"
```

### httpx AsyncClient Settings

- **Base URL**: `https://api.hunter.io/v2`
- **Timeout**: 15 seconds (per request)
- **Auth**: API key passed in query params (`?api_key=...`)

---

## Testing

Comprehensive test suite in `test_hunter.py` using `respx` mocking:

```bash
cd apps/sf-sales-engine
uv run pytest packages/scrapers/test_hunter.py -v
```

### Test Coverage

- ✓ `verify_email()` with valid email
- ✓ `verify_email()` with invalid email
- ✓ Rate limit handling (429)
- ✓ Auth failure handling (401)
- ✓ `find_email()` success case
- ✓ `find_email()` not found (404)
- ✓ `find_email()` rate limit
- ✓ `find_email_by_domain()` success
- ✓ `find_email_by_domain()` not found

All tests use `respx` for HTTP mocking and pytest-asyncio for async test support.

---

## Logging

Uses `structlog` for structured, async-safe logging:

```python
log.info("hunter.find_email.success", domain=domain, email=email, confidence=95)
log.warning("hunter.verify_email.rate_limited", email=email)
log.error("hunter.find_email.auth_failed", api_key_present=True)
log.debug("hunter.find_email.not_found", domain=domain, name="John Doe")
```

All log messages include context variables for debugging and monitoring.

---

## Integration with Enrichment Engine

The `HunterScraper` integrates with `EnrichmentEngine` (packages/enrichment/):

```python
from scrapers.hunter import HunterScraper

async def enrich_lead(lead):
    hunter = HunterScraper(api_key=os.getenv("HUNTER_API_KEY"))
    try:
        # Discover email if not present
        if not lead.get("email"):
            email = await hunter.find_email(
                lead["company_domain"],
                lead["first_name"],
                lead["last_name"]
            )
            if email:
                lead["email"] = email
                
        # Verify email quality
        if lead.get("email"):
            result = await hunter.verify_email(lead["email"])
            lead["email_score"] = result["score"]
            lead["email_valid"] = result["valid"]
    finally:
        await hunter.close()
```

---

## Type Hints

Full Python 3.12+ type hints for IDE autocomplete and static analysis:

```python
class VerifyResult(TypedDict):
    valid: bool
    score: float
    regexp: bool
    mx_records: bool
    smtp_server: bool
    accept_all: bool
    disposable: bool
    free_email: bool
    status: str
    raw_data: dict
```

---

## Dependencies

- **httpx** ≥0.27 — async HTTP client
- **structlog** ≥24.2 — structured logging
- **typing** (stdlib) — type hints

---

## Hunter.io API Documentation

- **Email Finder**: `GET /email-finder` — find email by domain + name
- **Email Verifier**: `GET /email-verifier` — verify email validity
- **Rate Limits**: Depends on plan (typically 100+ requests/month for free tier)
- **Docs**: https://hunter.io/api

---

## Next Steps (Semana 3+)

1. Integrate with `EnrichmentEngine` orchestrator
2. Add caching layer (Redis) to avoid duplicate API calls
3. Add metrics/cost tracking (Hunter charges per request)
4. Add confidence thresholding for auto-qualification
5. Parallel scraping across multiple leads
