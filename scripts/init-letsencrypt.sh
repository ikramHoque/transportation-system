#!/usr/bin/env bash
# One-time bootstrap for the first Let's Encrypt certificate on a fresh VM.
#
# nginx refuses to start if the certificate files referenced in its config
# don't exist yet, but certbot can't obtain a real certificate until nginx
# is already running to serve the ACME HTTP-01 challenge -- so this script
# breaks that chicken-and-egg loop the standard way: generate a throwaway
# self-signed cert just so nginx will start, then replace it with a real
# one from Let's Encrypt and reload.
#
# Prerequisites:
#   - DOMAIN and LETSENCRYPT_EMAIL set in .env (at the repo root)
#   - DNS for DOMAIN already pointing at this VM's public IP
#   - Port 80 reachable from the internet (needed for issuance and renewal)
#
# Usage (from the repo root):
#   docker compose -f docker-compose.prod.yml up -d db backend
#   ./scripts/init-letsencrypt.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [ -z "${DOMAIN:-}" ] || [ -z "${LETSENCRYPT_EMAIL:-}" ]; then
  echo "Set DOMAIN and LETSENCRYPT_EMAIL in .env first." >&2
  exit 1
fi

COMPOSE=(docker compose -f docker-compose.prod.yml)
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

if "${COMPOSE[@]}" run --rm --entrypoint "/bin/sh -c" certbot \
  "test -f $CERT_PATH/fullchain.pem" 2>/dev/null; then
  echo "A certificate for $DOMAIN already exists -- nothing to do. Delete the certbot_etc volume first if you need to start over."
  exit 0
fi

echo "### Creating a temporary self-signed certificate so nginx can start ..."
"${COMPOSE[@]}" run --rm --entrypoint "/bin/sh -c" certbot "\
  mkdir -p $CERT_PATH && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout $CERT_PATH/privkey.pem \
    -out $CERT_PATH/fullchain.pem \
    -subj '/CN=localhost'"

echo "### Starting nginx with the temporary certificate ..."
"${COMPOSE[@]}" up -d frontend

echo "### Removing the temporary certificate ..."
"${COMPOSE[@]}" run --rm --entrypoint "/bin/sh -c" certbot "\
  rm -rf /etc/letsencrypt/live/$DOMAIN \
         /etc/letsencrypt/archive/$DOMAIN \
         /etc/letsencrypt/renewal/$DOMAIN.conf"

echo "### Requesting the real certificate from Let's Encrypt ..."
"${COMPOSE[@]}" run --rm --entrypoint "/bin/sh -c" certbot "\
  certbot certonly --webroot -w /var/www/certbot \
    --email $LETSENCRYPT_EMAIL -d $DOMAIN \
    --rsa-key-size 2048 --agree-tos --no-eff-email"

echo "### Reloading nginx with the real certificate ..."
"${COMPOSE[@]}" exec frontend nginx -s reload

echo "Done -- https://$DOMAIN is now serving a real Let's Encrypt certificate."
echo "The certbot service will keep renewing it automatically; nginx needs a"
echo "reload after each renewal to pick up the new cert (e.g. a host cron"
echo "entry running: docker compose -f docker-compose.prod.yml exec frontend nginx -s reload)."
