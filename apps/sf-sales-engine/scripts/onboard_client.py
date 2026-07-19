"""
Crea la estructura de un cliente nuevo copiando clients/_template/.

Uso: uv run python scripts/onboard_client.py <slug> "<Nombre del cliente>" <tier>
Ejemplo: uv run python scripts/onboard_client.py techcorp-mx "TechCorp México" growth
"""
import shutil
import sys
import uuid
from pathlib import Path

import structlog

log = structlog.get_logger()

TEMPLATE = Path(__file__).parent.parent / "clients" / "_template"
CLIENTS = Path(__file__).parent.parent / "clients"


def onboard(slug: str, name: str, tier: str) -> None:
    dest = CLIENTS / slug

    if dest.exists():
        log.error("client.already_exists", slug=slug)
        sys.exit(1)

    shutil.copytree(TEMPLATE, dest)

    # Actualiza config.yaml con los valores del cliente
    config = dest / "config.yaml"
    content = config.read_text()
    client_id = str(uuid.uuid4())
    content = content.replace('client_id: ""', f'client_id: "{client_id}"')
    content = content.replace('client_slug: ""', f'client_slug: "{slug}"')
    content = content.replace('client_name: ""', f'client_name: "{name}"')
    content = content.replace('tier: "starter"', f'tier: "{tier}"')
    config.write_text(content)

    log.info("client.onboarded", slug=slug, client_id=client_id, path=str(dest))
    print(f"\n✅ Cliente '{slug}' creado en clients/{slug}/")
    print(f"   UUID: {client_id}")
    print("\nSiguientes pasos:")
    print(f"   1. Edita clients/{slug}/icp-profile.yaml con el ICP del cliente")
    print(f"   2. Edita clients/{slug}/sources.yaml con las fuentes activas")
    print(f"   3. Añade el client_id a Supabase: make seed-brain slug={slug}")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Uso: python scripts/onboard_client.py <slug> '<nombre>' <tier>")
        sys.exit(1)
    onboard(sys.argv[1], sys.argv[2], sys.argv[3])
