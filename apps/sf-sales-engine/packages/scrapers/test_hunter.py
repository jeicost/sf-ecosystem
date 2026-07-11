"""Tests para HunterScraper — email verification y discovery."""
import pytest
import respx
from httpx import Response

from src.scrapers.hunter import HunterScraper

HUNTER_BASE_URL = "https://api.hunter.io/v2"


@pytest.fixture
async def scraper():
    """Crea un HunterScraper para pruebas."""
    s = HunterScraper(api_key="test-api-key")
    yield s
    await s.close()


@respx.mock
async def test_verify_email_valid(scraper):
    """Verifica un email válido."""
    respx.get(
        f"{HUNTER_BASE_URL}/email-verifier",
        params={
            "email": "john@example.com",
            "api_key": "test-api-key",
        },
    ).mock(
        return_value=Response(
            200,
            json={
                "data": {
                    "status": "valid",
                    "score": 100,
                    "regexp": True,
                    "mx_records": True,
                    "smtp_server": True,
                    "accept_all": False,
                    "disposable": False,
                    "free_email": False,
                }
            },
        )
    )

    result = await scraper.verify_email("john@example.com")
    assert result["valid"] is True
    assert result["score"] == 100
    assert result["status"] == "valid"


@respx.mock
async def test_verify_email_invalid(scraper):
    """Verifica un email inválido."""
    respx.get(
        f"{HUNTER_BASE_URL}/email-verifier",
        params={
            "email": "invalid@example.com",
            "api_key": "test-api-key",
        },
    ).mock(
        return_value=Response(
            200,
            json={
                "data": {
                    "status": "invalid",
                    "score": 10,
                    "regexp": False,
                    "mx_records": False,
                    "smtp_server": False,
                    "accept_all": False,
                    "disposable": True,
                    "free_email": False,
                }
            },
        )
    )

    result = await scraper.verify_email("invalid@example.com")
    assert result["valid"] is False
    assert result["score"] == 10
    assert result["disposable"] is True


@respx.mock
async def test_verify_email_rate_limited(scraper):
    """Maneja rate limit (429) gracefully."""
    respx.get(
        f"{HUNTER_BASE_URL}/email-verifier",
        params={
            "email": "test@example.com",
            "api_key": "test-api-key",
        },
    ).mock(return_value=Response(429, json={"error": "Rate limited"}))

    result = await scraper.verify_email("test@example.com")
    assert result["valid"] is False
    assert result["status"] == "rate_limited"


@respx.mock
async def test_verify_email_auth_failure(scraper):
    """Maneja fallos de autenticación (401)."""
    respx.get(
        f"{HUNTER_BASE_URL}/email-verifier",
        params={
            "email": "test@example.com",
            "api_key": "test-api-key",
        },
    ).mock(return_value=Response(401, json={"error": "Unauthorized"}))

    with pytest.raises(ValueError, match="API key inválida"):
        await scraper.verify_email("test@example.com")


@respx.mock
async def test_find_email_success(scraper):
    """Encuentra un email por nombre y dominio."""
    respx.get(
        f"{HUNTER_BASE_URL}/email-finder",
        params={
            "domain": "example.com",
            "first_name": "John",
            "last_name": "Doe",
            "api_key": "test-api-key",
        },
    ).mock(
        return_value=Response(
            200,
            json={
                "data": {
                    "email": "john.doe@example.com",
                    "confidence": 95,
                    "first_name": "John",
                    "last_name": "Doe",
                }
            },
        )
    )

    email = await scraper.find_email("example.com", "John", "Doe")
    assert email == "john.doe@example.com"


@respx.mock
async def test_find_email_not_found(scraper):
    """No encuentra email para una persona inexistente."""
    respx.get(
        f"{HUNTER_BASE_URL}/email-finder",
        params={
            "domain": "example.com",
            "first_name": "Unknown",
            "last_name": "Person",
            "api_key": "test-api-key",
        },
    ).mock(return_value=Response(404, json={"error": "Not found"}))

    email = await scraper.find_email("example.com", "Unknown", "Person")
    assert email is None


@respx.mock
async def test_find_email_rate_limited(scraper):
    """Maneja rate limit en find_email."""
    respx.get(
        f"{HUNTER_BASE_URL}/email-finder",
        params={
            "domain": "example.com",
            "first_name": "John",
            "last_name": "Doe",
            "api_key": "test-api-key",
        },
    ).mock(return_value=Response(429, json={"error": "Rate limited"}))

    email = await scraper.find_email("example.com", "John", "Doe")
    assert email is None


@respx.mock
async def test_find_email_by_domain_success(scraper):
    """Encuentra email principal de una empresa."""
    respx.get(
        f"{HUNTER_BASE_URL}/email-finder",
        params={
            "domain": "startup.com",
            "api_key": "test-api-key",
        },
    ).mock(
        return_value=Response(
            200,
            json={
                "data": {
                    "email": "hello@startup.com",
                    "confidence": 85,
                }
            },
        )
    )

    email = await scraper.find_email_by_domain("startup.com")
    assert email == "hello@startup.com"


@respx.mock
async def test_find_email_by_domain_not_found(scraper):
    """No encuentra email para dominio inexistente."""
    respx.get(
        f"{HUNTER_BASE_URL}/email-finder",
        params={
            "domain": "nonexistent-domain-12345.com",
            "api_key": "test-api-key",
        },
    ).mock(return_value=Response(404, json={"error": "Not found"}))

    email = await scraper.find_email_by_domain("nonexistent-domain-12345.com")
    assert email is None
