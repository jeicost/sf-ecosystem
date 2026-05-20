#!/bin/bash
cd "$(dirname "$0")/dg-editor"
source .venv/bin/activate
open http://localhost:8000/editor
python3 -m uvicorn main:app --reload --reload-exclude ".venv" --reload-exclude "*.db" --port 8000
