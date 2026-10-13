#!/bin/bash
set -e

# Create tenant mods dir if missing
mkdir -p /app/tree/mods /app/tree/native/base /app/tree/native/work

# Install tenant mod deps if they have package.json
if [ -f /app/tree/mods/package.json ]; then
  echo "[entrypoint] Installing tenant mod dependencies"
  cd /app/tree/mods && npm install --omit=dev 2>&1 | tail -3
  cd /app
fi

exec node --import tsx --conditions=development node_modules/@treenx/core/src/server/native-main.ts root.json --deployment native-deployment.json
