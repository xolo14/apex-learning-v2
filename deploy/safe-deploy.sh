#!/usr/bin/env bash
# Safe deploy on VPS — NEVER uses "git stash -u" (that deletes your .env file).
#
# Usage (on VPS):
#   cd /var/www/syncpedia-community && bash deploy/safe-deploy.sh
set -euo pipefail
APP_DIR="${APP_DIR:-/var/www/syncpedia-community}"
cd "$APP_DIR"

echo "==> Checking .env before deploy..."
if [ ! -f .env ]; then
  echo "ERROR: .env is MISSING at $APP_DIR/.env"
  echo "  cp .env.example .env && nano .env"
  echo "  Set DATABASE_URL (Neon), GOOGLE_CLIENT_ID, ADMIN_SECRET"
  exit 1
fi
if grep -q 'user:pass@host' .env 2>/dev/null; then
  echo "ERROR: DATABASE_URL is still the placeholder in .env"
  echo "  nano .env  — paste your Neon connection string"
  exit 1
fi

echo "==> Pulling latest code..."
if ! git pull origin main; then
  echo "==> Resetting generated files blocking pull..."
  git checkout -- src/routeTree.gen.ts 2>/dev/null || true
  git pull origin main
fi

echo "==> Building..."
npm run build

echo "==> Restarting PM2 (reloads .env via ecosystem.config.cjs)..."
pm2 delete syncpedia-community 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save

echo ""
bash deploy/check-server.sh
