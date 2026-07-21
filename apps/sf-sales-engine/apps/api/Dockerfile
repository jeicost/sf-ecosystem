FROM python:3.12-slim
WORKDIR /app
RUN pip install uv
COPY pyproject.toml uv.lock* ./
# uv sync valida TODOS los miembros del workspace (incluido apps/worker):
# copiar apps completo, no solo apps/api, o el build falla.
COPY apps ./apps
COPY packages ./packages
COPY clients ./clients
RUN uv sync --package api --no-dev
ENV PATH="/app/.venv/bin:$PATH"
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
