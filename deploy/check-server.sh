#!/usr/bin/env bash
# Run on VPS: bash deploy/check-server.sh
set -euo pipefail
APP_DIR="${APP_DIR:-/var/www/syncpedia-community}"
cd "$APP_DIR"

echo "=== .env ==="
if [ ! -f .env ]; then
  echo "MISSING: $APP_DIR/.env — copy from .env.example and set DATABASE_URL"
  exit 1
fi
grep -E '^(DATABASE_URL|GOOGLE_CLIENT_ID|ADMIN_SECRET)=' .env | sed 's/=.*$/=***/' || true

if grep -q 'user:pass@host' .env 2>/dev/null; then
  echo "ERROR: DATABASE_URL is still the .env.example placeholder"
  exit 1
fi

echo ""
echo "=== PM2 ==="
pm2 describe syncpedia-community 2>/dev/null | grep -E 'status|restarts|uptime' || echo "syncpedia-community not running"

echo ""
echo "=== Health API ==="
curl -sS "http://127.0.0.1:3001/api/public/health" | python3 -m json.tool 2>/dev/null || curl -sS "http://127.0.0.1:3001/api/public/health"

echo ""
echo "=== Recent logs ==="
pm2 logs syncpedia-community --lines 15 --nostream 2>/dev/null || true
