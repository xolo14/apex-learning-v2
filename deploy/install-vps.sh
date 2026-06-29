#!/usr/bin/env bash
# Syncpedia community app — VPS install (app.syncpedia.in only)
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/syncpedia-community}"
REPO_URL="${REPO_URL:-}"

echo "==> Syncpedia community deploy to $APP_DIR"

if ! command -v node >/dev/null; then
  echo "Install Node.js 20+ first (https://nodejs.org or nvm)."
  exit 1
fi

sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER:$USER" "$APP_DIR"

if [ -n "$REPO_URL" ]; then
  git clone "$REPO_URL" "$APP_DIR" || true
fi

cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "Copy .env.example to .env and fill DATABASE_URL + ADMIN_SECRET first."
  cp -n .env.example .env || true
  exit 1
fi

npm ci
npm run build

if command -v pm2 >/dev/null; then
  pm2 start deploy/ecosystem.config.cjs
  pm2 save
else
  echo "PM2 not found. Start manually: PORT=3000 NODE_ENV=production npm start"
fi

echo ""
echo "Done. Point DNS: app.syncpedia.in A record -> this VPS IP"
echo "Then configure nginx: deploy/nginx-app.syncpedia.in.conf"
echo "Community: https://app.syncpedia.in"
echo "Admin:     https://app.syncpedia.in/admin/login"
