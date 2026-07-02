#!/usr/bin/env bash
# One command from your Mac: push to GitHub + deploy on VPS.
#
#   npm run deploy
# or
#   bash deploy/publish.sh
#
# First time only — allow SSH without typing password each time:
#   ssh-copy-id root@213.210.37.247
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VPS_IP="${VPS_IP:-213.210.37.247}"
SSH_USER="${SSH_USER:-root}"
APP_DIR="${APP_DIR:-/var/www/syncpedia-community}"
BRANCH="${BRANCH:-main}"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: You have uncommitted changes. Commit first, then run npm run deploy"
  git status --short
  exit 1
fi

AHEAD="$(git rev-list --count "origin/${BRANCH}..HEAD" 2>/dev/null || echo 0)"
if [ "$AHEAD" = "0" ]; then
  echo "==> Nothing new to push — deploying current main on VPS anyway..."
else
  echo "==> Pushing ${AHEAD} commit(s) to origin/${BRANCH}..."
  git push origin "$BRANCH"
fi

echo "==> Deploying on ${SSH_USER}@${VPS_IP}..."
ssh -o StrictHostKeyChecking=accept-new "${SSH_USER}@${VPS_IP}" \
  "cd ${APP_DIR} && git fetch origin ${BRANCH} && git reset --hard origin/${BRANCH} && bash deploy/safe-deploy.sh"

echo ""
echo "=============================================="
echo " Live at https://app.syncpedia.in"
echo "=============================================="
