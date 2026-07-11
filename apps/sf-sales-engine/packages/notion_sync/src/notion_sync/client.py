import structlog
import httpx
from notion_sync.models import NotionLead, SyncResult

log = structlog.get_logger()

NOTION_BASE_URL = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"


class NotionSyncClient:
    """Sync bidireccional entre Supabase y Notion CRM del cliente."""

    def __init__(self, api_key: str, database_id: str) -> None:
        self.database_id = database_id
        self._client = httpx.AsyncClient(
            base_url=NOTION_BASE_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Notion-Version": NOTION_VERSION,
                "Content-Type": "application/json",
            },
            timeout=30,
        )

    async def get_database_schema(self) -> dict:
        """Retorna las propiedades actuales de la DB de Notion."""
        r = await self._client.get(f"/databases/{self.database_id}")
        r.raise_for_status()
        return r.json()

    async def ensure_properties(self, required_props: dict) -> None:
        """Crea propiedades que faltan en la DB (Lead Score, Stage, etc.)."""
        # TODO Semana 2: PATCH /databases/{id} con propiedades faltantes
        log.info("notion.ensure_properties.stub", db=self.database_id)
        raise NotImplementedError("ensure_properties — Semana 2")

    async def upsert_lead(self, lead: NotionLead) -> str:
        """Crea o actualiza un lead en Notion. Retorna el page_id."""
        # TODO Semana 2: query por email → update si existe, create si no
        raise NotImplementedError("upsert_lead — Semana 2")

    async def query_leads(self, filter_: dict | None = None) -> list[NotionLead]:
        """Consulta leads desde Notion (para sync inverso)."""
        # TODO Semana 2: POST /databases/{id}/query
        raise NotImplementedError("query_leads — Semana 2")

    async def sync_batch(self, leads: list[NotionLead]) -> SyncResult:
        """Sincroniza un batch de leads a Notion. Retorna stats."""
        result = SyncResult(total=len(leads), created=0, updated=0, errors=0)
        for lead in leads:
            try:
                await self.upsert_lead(lead)
                result.created += 1
            except Exception as e:
                result.errors += 1
                result.error_details.append(str(e))
        return result

    async def close(self) -> None:
        await self._client.aclose()
