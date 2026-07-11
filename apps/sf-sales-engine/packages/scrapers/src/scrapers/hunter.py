import structlog
import httpx
from typing import TypedDict

log = structlog.get_logger()

HUNTER_BASE_URL = "https://api.hunter.io/v2"


class VerifyResult(TypedDict):
    """Estructura de respuesta de email verification."""
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


class HunterScraper:
    """Verifica y descubre emails corporativos con Hunter.io."""

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key
        self._client = httpx.AsyncClient(
            base_url=HUNTER_BASE_URL,
            timeout=15,
        )

    async def verify_email(self, email: str) -> VerifyResult:
        """Verifica si un email es válido usando Hunter email-verifier."""
        params = {"email": email, "api_key": self._api_key}

        try:
            r = await self._client.get("/email-verifier", params=params)

            # Manejo de rate limits
            if r.status_code == 429:
                log.warning("hunter.verify_email.rate_limited", email=email)
                return {
                    "valid": False,
                    "score": 0.0,
                    "regexp": False,
                    "mx_records": False,
                    "smtp_server": False,
                    "accept_all": False,
                    "disposable": False,
                    "free_email": False,
                    "status": "rate_limited",
                    "raw_data": {},
                }

            # Manejo de autenticación
            if r.status_code == 401:
                log.error("hunter.verify_email.auth_failed", api_key_present=bool(self._api_key))
                raise ValueError("Hunter API key inválida o expirada")

            r.raise_for_status()

            data = r.json()
            result = data.get("data", {})

            log.info(
                "hunter.verify_email.success",
                email=email,
                valid=result.get("status") == "valid",
                score=result.get("score"),
            )

            return {
                "valid": result.get("status") == "valid",
                "score": float(result.get("score", 0)),
                "regexp": result.get("regexp", False),
                "mx_records": result.get("mx_records", False),
                "smtp_server": result.get("smtp_server", False),
                "accept_all": result.get("accept_all", False),
                "disposable": result.get("disposable", False),
                "free_email": result.get("free_email", False),
                "status": result.get("status", "unknown"),
                "raw_data": result,
            }

        except httpx.HTTPError as e:
            log.error("hunter.verify_email.http_error", email=email, error=str(e))
            raise

    async def find_email(self, domain: str, first_name: str, last_name: str) -> str | None:
        """Descubre el email de una persona por dominio + nombre usando Hunter email-finder."""
        params = {
            "domain": domain,
            "first_name": first_name,
            "last_name": last_name,
            "api_key": self._api_key,
        }

        try:
            r = await self._client.get("/email-finder", params=params)

            # Manejo de rate limits
            if r.status_code == 429:
                log.warning(
                    "hunter.find_email.rate_limited",
                    domain=domain,
                    name=f"{first_name} {last_name}",
                )
                return None

            # Manejo de autenticación
            if r.status_code == 401:
                log.error("hunter.find_email.auth_failed", api_key_present=bool(self._api_key))
                raise ValueError("Hunter API key inválida o expirada")

            # 404 significa que no encontró el email
            if r.status_code == 404:
                log.debug(
                    "hunter.find_email.not_found",
                    domain=domain,
                    name=f"{first_name} {last_name}",
                )
                return None

            r.raise_for_status()

            data = r.json()
            result = data.get("data", {})
            email = result.get("email")

            if email:
                # Verificar el email encontrado si tenemos confianza alta
                confidence = result.get("confidence", 0)
                log.info(
                    "hunter.find_email.success",
                    domain=domain,
                    name=f"{first_name} {last_name}",
                    email=email,
                    confidence=confidence,
                )
                return email

            log.debug(
                "hunter.find_email.no_email_in_response",
                domain=domain,
                name=f"{first_name} {last_name}",
            )
            return None

        except httpx.HTTPError as e:
            log.error(
                "hunter.find_email.http_error",
                domain=domain,
                name=f"{first_name} {last_name}",
                error=str(e),
            )
            raise

    async def find_email_by_domain(self, company_domain: str) -> str | None:
        """Versión simplificada que busca el email principal de una empresa (CEO/info)."""
        params = {
            "domain": company_domain,
            "api_key": self._api_key,
        }

        try:
            r = await self._client.get("/email-finder", params=params)

            if r.status_code == 429:
                log.warning("hunter.find_email_by_domain.rate_limited", domain=company_domain)
                return None

            if r.status_code == 401:
                log.error("hunter.find_email_by_domain.auth_failed")
                raise ValueError("Hunter API key inválida o expirada")

            if r.status_code == 404:
                log.debug("hunter.find_email_by_domain.not_found", domain=company_domain)
                return None

            r.raise_for_status()

            data = r.json()
            result = data.get("data", {})
            email = result.get("email")

            if email:
                log.info("hunter.find_email_by_domain.success", domain=company_domain, email=email)
                return email

            return None

        except httpx.HTTPError as e:
            log.error("hunter.find_email_by_domain.http_error", domain=company_domain, error=str(e))
            raise

    async def close(self) -> None:
        await self._client.aclose()
