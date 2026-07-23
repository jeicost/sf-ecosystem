"""Resolve a client's local clients/<slug>/ folder from its Supabase client_id.

Both leads_search.py and discovery.py need a client_slug to load per-client
YAML config (sources.yaml, icp-profile.yaml). Most callers (MIRA, sf-crm) pass
client_id values from Supabase's shared `clients` table, which has no
corresponding clients/<slug>/ folder here -- only sf-internal and any
Python-engine-onboarded clients do. resolve_client_slug() returns None in
that case; callers must fall back to sane defaults rather than silently
assuming any particular client's config applies (that was the original bug:
both call sites hardcoded "sf-internal" for everyone).
"""
from pathlib import Path
from uuid import UUID

import yaml


def _find_clients_root(start: Path) -> Path:
    """Walk up from `start` until a directory containing clients/ is found.

    A previous fixed-depth `.parent.parent.parent.parent` in both call sites
    pointed one level too shallow (apps/api/ instead of the repo root), so
    clients/ never actually resolved for anyone, including sf-internal.
    """
    for candidate in (start, *start.parents):
        if (candidate / "clients").is_dir():
            return candidate / "clients"
    return start / "clients"


CLIENTS_ROOT = _find_clients_root(Path(__file__).resolve())


def resolve_client_slug(client_id: UUID) -> str | None:
    """Scan clients/*/config.yaml for the one whose client_id matches. None if no match."""
    if not CLIENTS_ROOT.exists():
        return None
    for client_dir in CLIENTS_ROOT.iterdir():
        config_path = client_dir / "config.yaml"
        if not config_path.exists():
            continue
        try:
            config = yaml.safe_load(config_path.read_text()) or {}
        except yaml.YAMLError:
            continue
        if str(config.get("client_id", "")) == str(client_id):
            return client_dir.name
    return None
