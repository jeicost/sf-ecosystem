#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# start-dev.sh — Arranca el entorno de desarrollo completo
#
# Modos:
#   ./start-dev.sh mock     → editor + mock API (sin necesidad de FastAPI)
#   ./start-dev.sh fastapi  → editor + FastAPI con SQLite (modo actual)
#   ./start-dev.sh          → mock por defecto
#
# Puertos:
#   :3100 → Mock API (simula api.discoolver.com)
#   :5173 → Editor React (Vite)
#   :8000 → FastAPI (solo en modo fastapi)
# ─────────────────────────────────────────────────────────────────────────────

MODE=${1:-mock}
DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "⏹  Deteniendo procesos..."
  kill $MOCK_PID $EDITOR_PID $FASTAPI_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

echo ""
echo "  ┌─────────────────────────────────────────────┐"
echo "  │   Discoolver Guide Editor — Dev Environment │"
echo "  │   Modo: $MODE                                │"
echo "  └─────────────────────────────────────────────┘"
echo ""

if [ "$MODE" = "mock" ]; then
  # Arrancar mock API
  echo "  🟡 Arrancando Mock API en :3100..."
  cd "$DIR/mock-api" && node server.js &
  MOCK_PID=$!
  sleep 1

  # Arrancar editor apuntando al mock
  echo "  🟡 Arrancando Editor (mock mode) en :5173..."
  cd "$DIR/editor" && npm run dev:mock &
  EDITOR_PID=$!

  echo ""
  echo "  ✅ Todo arrancado:"
  echo "     Mock API  →  http://localhost:3100"
  echo "     Editor    →  http://localhost:5173"
  echo ""
  echo "  Presiona Ctrl+C para detener."

elif [ "$MODE" = "fastapi" ]; then
  # Arrancar FastAPI
  echo "  🟡 Arrancando FastAPI en :8000..."
  cd "$DIR" && .venv/bin/python3 -m uvicorn main:app --port 8000 &
  FASTAPI_PID=$!
  sleep 3

  # Arrancar editor apuntando al FastAPI
  echo "  🟡 Arrancando Editor (fastapi mode) en :5173..."
  cd "$DIR/editor" && npm run dev &
  EDITOR_PID=$!

  echo ""
  echo "  ✅ Todo arrancado:"
  echo "     FastAPI   →  http://localhost:8000"
  echo "     Editor    →  http://localhost:5173"
  echo "     API docs  →  http://localhost:8000/docs"
  echo ""
  echo "  Presiona Ctrl+C para detener."

else
  echo "  ❌ Modo desconocido: $MODE"
  echo "  Uso: ./start-dev.sh [mock|fastapi]"
  exit 1
fi

wait
