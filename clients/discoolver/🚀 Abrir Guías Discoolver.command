#!/bin/bash
cd "/Users/carlosjacoste/Developer/discoolver-dg-editor"
source .venv/bin/activate
open http://localhost:8000/editor
python3 -m uvicorn main:app --reload --reload-exclude ".venv" --reload-exclude "*.db" --port 8000
