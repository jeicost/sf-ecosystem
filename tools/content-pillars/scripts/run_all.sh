#!/usr/bin/env bash
# One-shot: validate → generate own references → render → build deck.
# Usage: bash scripts/run_all.sh <brand.json> <pillars.json> <posts.json> [outdir]
set -e
BRAND="${1:-config/brand.json}"; PILLARS="${2:-config/pillars.json}"; POSTS="${3:-examples/posts.example.json}"; OUT="${4:-output}"
mkdir -p "$OUT"
node scripts/validate.js "$BRAND" "$PILLARS" "$POSTS"
node scripts/post_reference.js --brand "$BRAND" --posts "$POSTS" --out "$OUT"
python3 scripts/render_svg.py "$OUT" 800
node scripts/build_deck.js --brand "$BRAND" --pillars "$PILLARS" --posts "$POSTS" --refs "$OUT" --out "$OUT/deck.pptx"
echo "Done → $OUT/deck.pptx"
