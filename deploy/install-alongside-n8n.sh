#!/usr/bin/env bash
# Install Syncpedia community app ALONGSIDE n8n — does NOT modify n8n or existing nginx sites.
# Run as root in Hostinger Browser terminal:
#   curl -fsSL https://raw.githubusercontent.com/xolo14/apex-learning-v2/main/deploy/install-alongside-n8n.sh | bash
# Or after git clone:
#   bash deploy/install-alongside-n8n.sh
set -euo pipefail

APP_DIR="/var/www/syncpedia-community"
APP_PORT=3001
DOMAIN="app.syncpedia.in"
REPO="${REPO:-https://github.com/xolo14/apex-learning-v2.git}"

echo "==> Syncpedia install (n8n-safe: port ${APP_PORT}, new nginx site only)"

# --- 1. Packages (skip if already installed) ---
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git nginx rsync

if ! command -v node >/dev/null || [[ $(node -v 2>/dev/null | cut -d. -f1 | tr -d v) -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
npm install -g pm2 2>/dev/null || true

# --- 2. Clone / update app ---
mkdir -p "$APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull
else
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# --- 3. Environment ---
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo ">>> EDIT .env NOW (DATABASE_URL + ADMIN_SECRET), then run this script again or:"
  echo "    nano $APP_DIR/.env && cd $APP_DIR && npm ci && npm run build && pm2 restart syncpedia-community"
  echo ""
  # Generate a random admin secret suggestion
  RAND=$(openssl rand -hex 12 2>/dev/null || echo "change-me-$(date +%s)")
  sed -i "s|ADMIN_SECRET=.*|ADMIN_SECRET=${RAND}|" .env 2>/dev/null || true
  echo ">>> Temporary ADMIN_SECRET written to .env — change it after first login."
fi

grep -q '^VITE_SITE_URL=' .env || echo 'VITE_SITE_URL=https://app.syncpedia.in' >> .env
grep -q '^NODE_ENV=' .env || echo 'NODE_ENV=production' >> .env
grep -q '^PORT=' .env || echo "PORT=${APP_PORT}" >> .env
grep -q '^HOST=' .env || echo 'HOST=127.0.0.1' >> .env

if grep -q 'DATABASE_URL=postgresql://user:pass' .env; then
  echo "ERROR: Set real DATABASE_URL in $APP_DIR/.env first (Neon connection string)."
  echo "  nano $APP_DIR/.env"
  exit 1
fi

# --- 4. Build & PM2 (separate process from n8n) ---
npm ci
npm run build
pm2 delete syncpedia-community 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# --- 5. Nginx — NEW file only, does not touch n8n config ---
NGINX_SITE="/etc/nginx/sites-available/${DOMAIN}"
if [ ! -f "$NGINX_SITE" ]; then
  cat > "$NGINX_SITE" <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX
  ln -sf "$NGINX_SITE" "/etc/nginx/sites-enabled/${DOMAIN}"
  echo "==> Added nginx site: $NGINX_SITE (n8n configs untouched)"
fi

nginx -t
systemctl reload nginx

echo ""
echo "=============================================="
echo " Syncpedia community is running (n8n unchanged)"
echo " Port:    ${APP_PORT} (internal)"
echo " PM2:     pm2 status"
echo " Site:    http://${DOMAIN}  (after DNS A record: app -> VPS IP)"
echo " Admin:   http://${DOMAIN}/admin/login"
echo ""
echo " DNS: A record  app -> $(curl -4 -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')  (for app.syncpedia.in)"
echo ""
echo " HTTPS: certbot --nginx -d ${DOMAIN}"
echo "=============================================="
