#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS_DIR="$ROOT_DIR/android/app/src/main/assets"

cd "$ROOT_DIR"
npm run build
rm -rf "$ASSETS_DIR"
mkdir -p "$ASSETS_DIR"
cp -R dist/. "$ASSETS_DIR/"
