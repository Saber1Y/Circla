#!/bin/sh
set -e

# Seed the persistent circle binding file on first boot so existing group
# -> vault mappings survive container restarts. Subsequent boots keep whatever
# the running bot has stored on the attached disk.
if [ ! -f /app/data/circles.json ]; then
  mkdir -p /app/data
  cp /app/seed/circles.json /app/data/circles.json
  echo "[circla] seeded circle bindings from image"
fi

exec "$@"