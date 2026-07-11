FROM python:3.12-slim
WORKDIR /app
RUN pip install uv
COPY pyproject.toml uv.lock* ./
COPY apps/api ./apps/api
COPY packages ./packages
RUN uv sync --package api --no-dev
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
