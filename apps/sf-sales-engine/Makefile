.PHONY: install lint test dev-api dev-n8n seed-vbs discover-leads migrate

install:
	uv sync --all-packages

lint:
	uv run ruff check .
	uv run mypy apps packages

test:
	uv run pytest --cov --cov-report=term-missing -q

dev-api:
	uv run --package api uvicorn api.main:app --reload --port 8000

dev-n8n:
	docker compose up n8n -d
	@echo "n8n running at http://localhost:5678"

seed-vbs:
	uv run python scripts/seed_vbs.py

discover-leads:
	uv run python scripts/discover_leads.py

discover-dry:
	uv run python scripts/discover_leads.py --dry-run

migrate:
	@echo "Apply migrations via Supabase dashboard or supabase CLI:"
	@echo "  supabase db push"
	@ls supabase/migrations/
