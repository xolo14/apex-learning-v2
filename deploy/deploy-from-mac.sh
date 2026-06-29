#!/usr/bin/env bash
# Run from your Mac/Cursor terminal (project root):
#   chmod +x deploy/deploy-from-mac.sh
#   VPS_IP=213.210.37.247 SSH_USER=root ./deploy/deploy-from-mac.sh
#
# Requires: passwordless SSH (ssh key) OR you'll be prompted for password several times.
set -euo pipefail

VPS_IP="${VPS_IP:-213.210.37.247}"
SSH_USER="${SSH_USER:-root}"
APP_DIR="${APP_DIR:-/var/www/syncpedia-community}"
DOMAIN="${DOMAIN:-app.syncpedia.in}"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

SSH="ssh -o StrictHostKeyChecking=accept-new ${SSH_USER}@${VPS_IP}"
RSYNC="rsync -avz --delete --exclude node_modules --exclude .git --exclude .output"

echo "==> Testing SSH to ${SSH_USER}@${VPS_IP}..."
if ! $SSH "echo OK" 2>/dev/null; then
  echo ""
  echo "SSH failed. Fix login first:"
  echo "  1. Reset VPS password in your provider panel"
  echo "  2. Try: ssh ubuntu@${VPS_IP}  (some VPS use ubuntu not root)"
  echo "  3. Or add SSH key: ssh-copy-id ${SSH_USER}@${VPS_IP}"
  exit 1
fi

echo "==> Installing server packages (Node 20, nginx, pm2)..."
$SSH "bash -s" <<'REMOTE_SETUP'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx rsync
if ! command -v node >/dev/null || [[ $(node -v | cut -d. -f1 | tr -d v) -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
npm install -g pm2 2>/dev/null || true
mkdir -p /var/www/syncpedia-community
REMOTE_SETUP

echo "==> Uploading project..."
$RSYNC "$LOCAL_DIR/" "${SSH_USER}@${VPS_IP}:${APP_DIR}/"

echo "==> Building on server..."
$SSH "bash -s" <<REMOTE_BUILD
set -euo pipefail
cd ${APP_DIR}
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "WARNING: Created .env from example — edit DATABASE_URL and ADMIN_SECRET on VPS:"
  echo "  ssh ${SSH_USER}@${VPS_IP}"
  echo "  nano ${APP_DIR}/.env"
fi
npm ci
npm run build
pm2 delete syncpedia-community 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save
REMOTE_BUILD

echo "==> Configuring nginx for ${DOMAIN}..."
$SSH "bash -s" <<REMOTE_NGINX
set -euo pipefail
cat > /etc/nginx/sites-available/${DOMAIN} <<'NGINX'
server {
    listen 80;
    server_name app.syncpedia.in;

    location / {
        proxy_pass http://127.0.0.1:3000;
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
ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/${DOMAIN}
nginx -t
systemctl reload nginx
REMOTE_NGINX

echo ""
echo "=============================================="
echo " Deploy complete (HTTP)."
echo " Community: http://${DOMAIN}"
echo " Admin:     http://${DOMAIN}/admin/login"
echo ""
echo " Next steps:"
echo "  1. Hostinger DNS: A record  app -> ${VPS_IP}"
echo "  2. Edit .env on VPS: DATABASE_URL + ADMIN_SECRET"
echo "     ssh ${SSH_USER}@${VPS_IP} 'nano ${APP_DIR}/.env'"
echo "     pm2 restart syncpedia-community"
echo "  3. HTTPS: ssh ${SSH_USER}@${VPS_IP} 'certbot --nginx -d ${DOMAIN}'"
echo "=============================================="
