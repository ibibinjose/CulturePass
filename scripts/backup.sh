#!/usr/bin/env bash
# backup.sh - Robust snapshot script for CulturePass

# 1. Robustly find the project root using Git
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    PROJECT_ROOT="$(git rev-parse --show-toplevel)"
else
    # Fallback to relative path if git fails
    PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

cd "$PROJECT_ROOT"

# 2. Configuration
NAME="xCxPxAx"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
# Requested: name, date and time
ARCHIVE_NAME="${NAME}_${TIMESTAMP}.tar.gz"
# Save to parent directory (one before this folder)
DEST_DIR=".."

echo "==> CulturePass Backup"
echo "    Project : $PROJECT_ROOT"
echo "    Output  : $DEST_DIR/$ARCHIVE_NAME"
echo "    Time    : $(date)"
echo ""

# 3. Git snapshot
echo "[1/2] Git snapshot..."
git add -A
if git diff --cached --quiet; then
    echo "      Nothing to commit — working tree clean."
else
    git commit -m "chore: backup snapshot ${TIMESTAMP}"
    echo "      Committed: $(git log -1 --oneline)"
fi

# 4. Create archive
echo "[2/2] Creating archive..."
# Archive from the parent directory to preserve the project folder structure
PARENT_DIR="$(dirname "$PROJECT_ROOT")"
PROJECT_DIR_NAME="$(basename "$PROJECT_ROOT")"

tar -czf "$DEST_DIR/$ARCHIVE_NAME" \
  -C "$PARENT_DIR" \
  --exclude="$PROJECT_DIR_NAME/node_modules" \
  --exclude="$PROJECT_DIR_NAME/.expo" \
  --exclude="$PROJECT_DIR_NAME/.git" \
  --exclude="$PROJECT_DIR_NAME/dist" \
  --exclude="$PROJECT_DIR_NAME/*.log" \
  "$PROJECT_DIR_NAME"

echo "      Archive saved to: $(cd "$DEST_DIR" && pwd)/$ARCHIVE_NAME"
echo ""
echo "==> Backup complete."
