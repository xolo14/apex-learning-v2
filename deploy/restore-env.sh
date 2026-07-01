#!/usr/bin/env bash
# Recover .env if it was removed by "git stash -u" during a bad deploy.
set -euo pipefail
APP_DIR="${APP_DIR:-/var/www/syncpedia-community}"
cd "$APP_DIR"

if [ -f .env ] && grep -qE '^DATABASE_URL=postgresql://' .env && ! grep -q 'user:pass@host' .env; then
  echo "OK: .env already has a real DATABASE_URL"
  exit 0
fi

echo "Looking for .env in git stash (from git stash -u)..."
found=0
while IFS= read -r line; do
  stash="${line%%:*}"
  if git stash show -p "$stash" -- .env 2>/dev/null | grep -q DATABASE_URL; then
    echo "Found .env in $stash — restoring..."
    git checkout "$stash" -- .env 2>/dev/null || git stash show -p "$stash" -- .env > .env
    found=1
    break
  fi
done < <(git stash list 2>/dev/null || true)

if [ "$found" = 1 ]; then
  echo "Restored .env — verify and restart:"
  grep -E '^(DATABASE_URL|GOOGLE_CLIENT_ID)=' .env | sed 's/=.*$/=***/'
  echo "  pm2 delete syncpedia-community && pm2 start deploy/ecosystem.config.cjs && pm2 save"
  exit 0
fi

echo ""
echo "Could not find .env in stash. Create it manually:"
echo "  1. Open https://console.neon.tech → your project → Connection string"
echo "  2. nano $APP_DIR/.env"
echo "  3. Set:"
echo "       DATABASE_URL=postgresql://....?sslmode=require"
echo "       GOOGLE_CLIENT_ID=....apps.googleusercontent.com"
echo "       VITE_GOOGLE_CLIENT_ID=....apps.googleusercontent.com"
echo "       ADMIN_SECRET=your-long-random-secret"
echo "  4. pm2 delete syncpedia-community && pm2 start deploy/ecosystem.config.cjs && pm2 save"
