#!/bin/bash
set -e

# Create tenant mods dir if missing
mkdir -p /app/tree/mods

# Install tenant mod deps if they have package.json
if [ -f /app/tree/mods/package.json ]; then
  echo "[entrypoint] Installing tenant mod dependencies"
  cd /app/tree/mods && npm install --omit=dev 2>&1 | tail -3
  cd /app
fi

exec tsx node_modules/@treenx/core/src/server/main.ts root.json
