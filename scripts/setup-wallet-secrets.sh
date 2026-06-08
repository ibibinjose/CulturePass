#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# CulturePass — Apple & Google Wallet Secrets Setup Script
# ──────────────────────────────────────────────────────────────────────────────

set -e

echo "=========================================================="
echo "      CulturePass Wallet Credentials Configurator"
echo "=========================================================="
echo ""
echo "This script automates the PEM certificate conversion and"
echo "registers your credentials as secure Firebase secrets."
echo ""
echo "PREREQUISITES:"
echo "Please make sure you have placed the following files in a"
echo "folder named 'temp-certs' in the project root:"
echo "  1. pass.p12      (Apple Pass Certificate exported from Keychain)"
echo "  2. wwdr.cer      (Apple WWDR G3 certificate from Apple PKI)"
echo "  3. service-account.json  (Google Service Account private key JSON)"
echo ""

# Create directory if it doesn't exist
mkdir -p temp-certs

read -p "Have you copied the files into 'temp-certs/'? (y/N): " files_copied
if [[ "$files_copied" != "y" && "$files_copied" != "Y" ]]; then
  echo "❌ Please copy the files to 'temp-certs/' and re-run this script."
  exit 1
fi

# Check for files
if [ ! -f "temp-certs/pass.p12" ]; then
  echo "❌ Error: temp-certs/pass.p12 not found."
  exit 1
fi
if [ ! -f "temp-certs/wwdr.cer" ]; then
  echo "❌ Error: temp-certs/wwdr.cer not found."
  exit 1
fi
if [ ! -f "temp-certs/service-account.json" ]; then
  echo "❌ Error: temp-certs/service-account.json not found."
  exit 1
fi

# Prompt for secrets / IDs
echo ""
echo "--- Apple Config ---"
read -p "Apple Pass Type Identifier (default: pass.au.culturepass.app): " APPLE_PASS_TYPE_IDENTIFIER
APPLE_PASS_TYPE_IDENTIFIER=${APPLE_PASS_TYPE_IDENTIFIER:-pass.au.culturepass.app}

read -p "Apple Team ID (default: 26WGXSNG58): " APPLE_TEAM_IDENTIFIER
APPLE_TEAM_IDENTIFIER=${APPLE_TEAM_IDENTIFIER:-26WGXSNG58}

read -sp "Apple pass.p12 Password (press enter if blank): " P12_PASS
echo ""

echo ""
echo "--- Google Config ---"
read -p "Google Wallet Issuer ID: " GOOGLE_WALLET_ISSUER_ID
if [ -z "$GOOGLE_WALLET_ISSUER_ID" ]; then
  echo "❌ Google Wallet Issuer ID is required."
  exit 1
fi

read -p "Google Generic Class ID (default: culturepass_member_card): " GOOGLE_WALLET_GENERIC_CLASS_ID
GOOGLE_WALLET_GENERIC_CLASS_ID=${GOOGLE_WALLET_GENERIC_CLASS_ID:-culturepass_member_card}

echo ""
echo "--- App Config ---"
read -p "Firebase Project ID (default: culturepass-4f264): " FIREBASE_PROJECT_ID
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID:-culturepass-4f264}

# Ensure logged into firebase
echo ""
echo "Checking Firebase CLI login..."
npx firebase-tools login

# 1. Convert Apple Certificates using OpenSSL
echo ""
echo "Converting Apple certificates to PEM..."

# Extract signing cert
openssl pkcs12 -in temp-certs/pass.p12 -clcerts -nokeys -out temp-certs/signerCert.pem -passin "pass:$P12_PASS"

# Extract private key (decrypted)
openssl pkcs12 -in temp-certs/pass.p12 -nocerts -nodes -out temp-certs/signerKey.pem -passin "pass:$P12_PASS"

# Convert WWDR DER to PEM
openssl x509 -inform der -in temp-certs/wwdr.cer -out temp-certs/wwdr.pem

# Extract Google service account details
echo "Reading Google Service Account JSON..."
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=$(node -e "console.log(require('./temp-certs/service-account.json').client_email)")
node -e "console.log(require('./temp-certs/service-account.json').private_key)" > temp-certs/googlePrivateKey.pem

# Generate random secure link signing secret
WALLET_LINK_SIGNING_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 2. Deploy Secrets to Firebase
echo ""
echo "Deploying secrets to Firebase project: $FIREBASE_PROJECT_ID..."

npx firebase-tools secrets:set APPLE_WWDR_CERT_PEM --project "$FIREBASE_PROJECT_ID" < temp-certs/wwdr.pem
npx firebase-tools secrets:set APPLE_PASS_SIGNER_CERT_PEM --project "$FIREBASE_PROJECT_ID" < temp-certs/signerCert.pem
npx firebase-tools secrets:set APPLE_PASS_SIGNER_KEY_PEM --project "$FIREBASE_PROJECT_ID" < temp-certs/signerKey.pem

npx firebase-tools secrets:set APPLE_PASS_TYPE_IDENTIFIER="$APPLE_PASS_TYPE_IDENTIFIER" --project "$FIREBASE_PROJECT_ID"
npx firebase-tools secrets:set APPLE_TEAM_IDENTIFIER="$APPLE_TEAM_IDENTIFIER" --project "$FIREBASE_PROJECT_ID"
npx firebase-tools secrets:set WALLET_LINK_SIGNING_SECRET="$WALLET_LINK_SIGNING_SECRET" --project "$FIREBASE_PROJECT_ID"

npx firebase-tools secrets:set GOOGLE_WALLET_ISSUER_ID="$GOOGLE_WALLET_ISSUER_ID" --project "$FIREBASE_PROJECT_ID"
npx firebase-tools secrets:set GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL="$GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL" --project "$FIREBASE_PROJECT_ID"
npx firebase-tools secrets:set GOOGLE_WALLET_PRIVATE_KEY --project "$FIREBASE_PROJECT_ID" < temp-certs/googlePrivateKey.pem
npx firebase-tools secrets:set GOOGLE_WALLET_GENERIC_CLASS_ID="$GOOGLE_WALLET_GENERIC_CLASS_ID" --project "$FIREBASE_PROJECT_ID"

npx firebase-tools functions:config:set wallet.PUBLIC_APP_ORIGIN="https://culturepass.app" --project "$FIREBASE_PROJECT_ID" 2>/dev/null || true

# Also append to functions/.env for deploy-time env loading
ENV_FILE="functions/.env"
touch "$ENV_FILE"
for kv in \
  "PUBLIC_APP_ORIGIN=https://culturepass.app" \
  "WALLET_LINKS_PUBLIC_ORIGIN=https://culturepass.app" \
  "APPLE_PASS_WEBSERVICE_URL=https://culturepass.app/api/wallet/apple/v1"; do
  key="${kv%%=*}"
  if ! grep -q "^${key}=" "$ENV_FILE"; then
    echo "$kv" >> "$ENV_FILE"
  fi
done

# Clean up temp files
echo ""
echo "Cleaning up temporary PEM files..."
rm -rf temp-certs/*.pem

echo ""
echo "=========================================================="
echo " 🎉 Successfully configured all Wallet Secrets!"
echo "=========================================================="
echo "Next step: Re-deploy your Firebase functions to apply changes:"
echo "  npm run deploy-functions"
echo "=========================================================="
