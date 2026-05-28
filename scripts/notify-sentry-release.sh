#!/bin/bash
#
# Notify Sentry of a new release using the built-in release hook.
# This is a lightweight way to create releases without sentry-cli.
#
# Usage:
#   ./scripts/notify-sentry-release.sh "1.3.0-b27@ios"
#
# In GitHub Actions (recommended):
#   env:
#     SENTRY_RELEASE_HOOK_URL: ${{ secrets.SENTRY_RELEASE_HOOK_URL }}
#   run: ./scripts/notify-sentry-release.sh "${VERSION}@${PLATFORM}"
#
# The version must match what you set in Sentry.init({ release: '...' }).
#

set -euo pipefail

VERSION="${1:-}"

if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 \"1.3.0-b42@ios\""
  exit 1
fi

if [[ -z "${SENTRY_RELEASE_HOOK_URL:-}" ]]; then
  echo "⚠️  SENTRY_RELEASE_HOOK_URL is not set. Skipping Sentry release notification."
  echo "   Set it as a GitHub secret or EAS secret for production workflows."
  exit 0
fi

echo "🚀 Notifying Sentry of release: $VERSION"

# Use --fail-with-body for better error messages
HTTP_STATUS=$(curl -sS -o /tmp/sentry-response.txt -w "%{http_code}" \
  -X POST \
  -H 'Content-Type: application/json' \
  -d "{\"version\": \"$VERSION\"}" \
  "$SENTRY_RELEASE_HOOK_URL")

if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
  echo "✅ Sentry release created successfully: $VERSION"
else
  echo "❌ Failed to create Sentry release (HTTP $HTTP_STATUS)"
  cat /tmp/sentry-response.txt
  # Do not fail the whole CI job for a release notification
  exit 0
fi