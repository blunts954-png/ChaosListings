#!/bin/bash
set -e
echo "Starting ListingsIQ Backend..."
npx prisma generate
node dist/src/main.js
