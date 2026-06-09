#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" != "false" ]; then
  node /app/docker/scripts/migrate.mjs
fi

exec node server.js
