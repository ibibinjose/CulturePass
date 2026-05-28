#!/usr/bin/env bash
# backup.sh - CulturePass Code Backup System
# Usage: npm run backup
#
# Creates a timestamped backup of the project with date and time.
# Backups are stored in the ./backups/ folder.

set -e

# Find project root
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    PROJECT_ROOT="$(git rev-parse --show-toplevel)"
else
    PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

cd "$PROJECT_ROOT"

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
ARCHIVE_NAME="CulturePass_${TIMESTAMP}.tar.gz"
ARCHIVE_PATH="${BACKUP_DIR}/${ARCHIVE_NAME}"

# Create backups directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "==> CulturePass Backup System"
echo "    Project   : $PROJECT_ROOT"
echo "    Timestamp : $TIMESTAMP"
echo "    Output    : $ARCHIVE_PATH"
echo ""

# Create the backup archive
echo "[1/1] Creating timestamped backup archive..."

tar -czf "$ARCHIVE_PATH" \
    --exclude='./node_modules' \
    --exclude='./.git' \
    --exclude='./dist' \
    --exclude='./.expo' \
    --exclude='./web/node_modules' \
    --exclude='./functions/node_modules' \
    --exclude='./backups' \
    --exclude='./*.log' \
    --exclude='./.DS_Store' \
    .

# Get size
SIZE=$(du -h "$ARCHIVE_PATH" | cut -f1)

echo ""
echo "==> Backup complete!"
echo "    File : $ARCHIVE_PATH"
echo "    Size : $SIZE"
echo "    Date : $(date)"
echo ""
echo "Tip: You can also run 'npm run backup' from anywhere in the project."
