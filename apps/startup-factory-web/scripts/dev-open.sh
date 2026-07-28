#!/bin/bash
# dev-open.sh — Arranca el servidor si no está corriendo y abre la URL en Chrome
# Uso: ./scripts/dev-open.sh [ruta]
# Ejemplo: ./scripts/dev-open.sh /es/que-hacemos-a

PORT=3001
PATH_TO_OPEN="${1:-/es}"
URL="http://localhost:${PORT}${PATH_TO_OPEN}"
PROJECT_DIR="$HOME/Desktop/Claude.nosync/apps/startup-factory-web"

# Comprobar si ya está corriendo en el puerto
if lsof -ti:${PORT} > /dev/null 2>&1; then
  echo "✓ Servidor ya corriendo en :${PORT}"
else
  echo "▶ Arrancando servidor en :${PORT}..."
  cd "$PROJECT_DIR"
  nohup npm run dev:3001 > /tmp/sf-dev.log 2>&1 &
  DEV_PID=$!
  echo "  PID: ${DEV_PID}"

  # Esperar hasta que responda (máx 30s)
  for i in $(seq 1 30); do
    sleep 1
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" "${URL}" 2>/dev/null)
    if [ "$HTTP" = "200" ]; then
      echo "✓ Listo en ${i}s"
      break
    fi
    if [ "$i" = "30" ]; then
      echo "✗ Timeout — revisa /tmp/sf-dev.log"
      exit 1
    fi
  done
fi

echo "→ Abriendo ${URL}"
open -a "Google Chrome" "${URL}"
