#!/bin/bash
set -e
echo "Deploying Daawat-E-Ramzaan..."

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build the standalone Next.js app
npm run build

# Next.js `output: standalone` does NOT include public/ or .next/static —
# these must be copied in after every build or static assets 404 in production.
cp -r public .next/standalone/public
mkdir -p .next/standalone/.next/static
cp -r .next/static/* .next/standalone/.next/static/

# .env and wa-auth must persist across rebuilds (the WhatsApp session lives in
# wa-auth/, and .env holds all runtime secrets) — symlink instead of copying so
# a fresh standalone build always points at the one persistent copy.
rm -rf .next/standalone/wa-auth
ln -s "$(pwd)/wa-auth" .next/standalone/wa-auth
rm -f .next/standalone/.env
ln -s "$(pwd)/.env" .next/standalone/.env

# Start or reload via PM2 (single fork instance — see ecosystem.config.js for why)
pm2 start ecosystem.config.js --env production || pm2 reload der-2026

echo "Deployment complete! App is running on port 3003 via PM2."
