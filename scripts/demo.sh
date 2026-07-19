#!/usr/bin/env bash
# Soroe demo script for OpenAI Devpost submission.
# Run from the repo root with: bash scripts/demo.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEMO_DIR="$REPO_ROOT/.demo"

rm -rf "$DEMO_DIR"
mkdir -p "$DEMO_DIR"

echo "==> Soroe demo: from references to verified implementation contract"
echo

echo "--> Step 1: init a recipe from two references"
"$REPO_ROOT/bin/soroe.js" init \
  --id devpost-demo \
  --title "Devpost Demo Site" \
  --references sharlee:https://itssharl.ee/,enscribe:https://enscribe.dev/ \
  --out "$DEMO_DIR/recipe.json"
echo "    wrote $DEMO_DIR/recipe.json"
echo

echo "--> Step 2: validate the recipe"
"$REPO_ROOT/bin/soroe.js" validate "$DEMO_DIR/recipe.json"
echo

echo "--> Step 3: design — compile recipe into a design system"
"$REPO_ROOT/bin/soroe.js" design "$DEMO_DIR/recipe.json" --out "$DEMO_DIR/design"
echo "    outputs:"
ls -1 "$DEMO_DIR/design" | sed 's/^/      /'
echo

echo "--> Step 4: build — compile design system into implementation contract"
"$REPO_ROOT/bin/soroe.js" build "$DEMO_DIR/design/facet-pack.json" --out "$DEMO_DIR/build"
echo "    outputs:"
ls -1 "$DEMO_DIR/build" | sed 's/^/      /'
echo

echo "--> Step 5: verify — run static checks against the contract"
# Use the build directory as a minimal site directory for the demo.
"$REPO_ROOT/bin/soroe.js" verify "$DEMO_DIR/build" --plan "$DEMO_DIR/build/verification.plan.json"
echo

echo "==> Demo complete. Artifacts are in $DEMO_DIR"
