# Build context: Disclover Guides/  (parent of dg-editor/)
# docker-compose passes context: .. so both dg-editor/ and design-studio/ are accessible.

# ── Stage 1: Build React editor ───────────────────────────────────────────────
FROM node:20-alpine AS editor-build
WORKDIR /build/editor
COPY dg-editor/editor/package*.json ./
RUN npm ci --quiet
COPY dg-editor/editor/ ./
RUN npm run build

# ── Stage 2: Build design-studio ──────────────────────────────────────────────
FROM node:20-alpine AS studio-build
WORKDIR /build/studio
COPY design-studio/package*.json ./
RUN npm ci --quiet
COPY design-studio/ ./
RUN npm run build

# ── Stage 3: Python backend ───────────────────────────────────────────────────
FROM python:3.11-slim

# System deps: WeasyPrint (pango/cairo) + Playwright Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 libpangocairo-1.0-0 libcairo2 libgdk-pixbuf2.0-0 \
    libffi-dev libssl-dev fonts-liberation \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libxshmfence1 \
    curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python deps first (cached layer)
COPY dg-editor/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright Chromium
RUN playwright install chromium --with-deps || true

# Copy backend source
COPY dg-editor/ .

# Overlay compiled frontends
COPY --from=editor-build /build/editor/dist  ./editor/dist
COPY --from=studio-build /build/studio/dist  ./design-studio/dist

# Runtime dirs
RUN mkdir -p exports static data/guides

# Pre-generate Excel template
RUN python -m app.services.excel_template || true

EXPOSE 8000

CMD ["/bin/sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2"]
