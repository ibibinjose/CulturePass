#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# CulturePass — Generate Mock Apple & Google Wallet Certs for Local Emulators
# ──────────────────────────────────────────────────────────────────────────────
set -e

mkdir -p temp-certs

echo "Generating mock RSA private key..."
openssl genrsa -out temp-certs/key.pem 2048

echo "Generating self-signed certificate..."
openssl req -new -x509 -key temp-certs/key.pem -out temp-certs/cert.pem -days 365 -subj "/CN=CulturePass Local Mock"

# Base64 encode them to be dot-env safe (continuous strings)
# macOS base64 has no options needed for simple stdin encoding, but we strip newlines
WWDR_B64=$(cat temp-certs/cert.pem | base64 | tr -d '\n\r')
SIGNER_CERT_B64=$(cat temp-certs/cert.pem | base64 | tr -d '\n\r')
SIGNER_KEY_B64=$(cat temp-certs/key.pem | base64 | tr -d '\n\r')

LINK_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo "Configuring functions/.env..."
# Create a backup of functions/.env first
cp functions/.env functions/.env.backup

# Append Apple config
if ! grep -q "APPLE_WWDR_CERT_PEM" functions/.env; then
  echo "" >> functions/.env
  echo "# Apple Wallet Local Mock Credentials" >> functions/.env
  echo "APPLE_WWDR_CERT_PEM=$WWDR_B64" >> functions/.env
  echo "APPLE_PASS_SIGNER_CERT_PEM=$SIGNER_CERT_B64" >> functions/.env
  echo "APPLE_PASS_SIGNER_KEY_PEM=$SIGNER_KEY_B64" >> functions/.env
  echo "APPLE_PASS_SIGNER_KEY_PASSPHRASE=" >> functions/.env
  echo "APPLE_PASS_TYPE_IDENTIFIER=pass.au.culturepass.app" >> functions/.env
  echo "APPLE_TEAM_IDENTIFIER=26WGXSNG58" >> functions/.env
  echo "WALLET_LINK_SIGNING_SECRET=$LINK_SECRET" >> functions/.env
fi

# Append Google config
if ! grep -q "GOOGLE_WALLET_ISSUER_ID" functions/.env; then
  echo "" >> functions/.env
  echo "# Google Wallet Local Mock Credentials" >> functions/.env
  echo "GOOGLE_WALLET_ISSUER_ID=1234567890123456789" >> functions/.env
  echo "GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=local-mock@culturepass.iam.gserviceaccount.com" >> functions/.env
  echo "GOOGLE_WALLET_PRIVATE_KEY=$SIGNER_KEY_B64" >> functions/.env
  echo "GOOGLE_WALLET_GENERIC_CLASS_ID=culturepass_member_card" >> functions/.env
fi

rm -rf temp-certs
echo "✅ Local wallet credentials successfully added to functions/.env"
