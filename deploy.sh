#!/bin/bash
echo "Deploying Daawat-E-Ramzaan 2026..."

# Pull latest code
# git pull origin main

# Install dependencies just in case
npm install

# Build the standalone Next.js app
npm run build

# Start or reload via PM2
pm2 start ecosystem.config.js --env production || pm2 reload der-2026

echo "Deployment complete! App is running on port 3000 via PM2."
