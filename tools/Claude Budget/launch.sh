#!/bin/bash
# Claude Budget — menu bar app
# Para auto-arranque: System Settings → General → Login Items → agregar este script
cd "$(dirname "$0")"
/Users/carlosjacoste/.local/bin/uv run --with rumps python3 claude_budget.py > /tmp/claude_budget.log 2>&1 &
echo "Claude Budget iniciado (PID: $!)"
