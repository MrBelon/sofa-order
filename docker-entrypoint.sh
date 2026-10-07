#!/bin/sh
set -e

echo "Applying database migrations..."
prisma migrate deploy

exec node server.js
