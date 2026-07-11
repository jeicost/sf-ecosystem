import hashlib

from scrapers.models import RawLead


def domain_from_email(email: str) -> str:
    return email.split("@")[-1].lower() if "@" in email else ""


def lead_fingerprint(lead: RawLead) -> str:
    """Hash único por dominio + nombre para deduplicar leads."""
    domain = domain_from_email(lead.email or "") or (lead.company_website or "")
    name = f"{lead.first_name or ''}{lead.last_name or ''}".lower().strip()
    return hashlib.sha256(f"{domain}:{name}".encode()).hexdigest()


def deduplicate(leads: list[RawLead]) -> list[RawLead]:
    """Elimina duplicados dentro de un batch por fingerprint."""
    seen: set[str] = set()
    unique: list[RawLead] = []
    for lead in leads:
        fp = lead_fingerprint(lead)
        if fp not in seen:
            seen.add(fp)
            unique.append(lead)
    return unique
