#!/usr/bin/env bash
# backup.sh - Snapshot CulturePass project

# 1. Robustly find the project root
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    PROJECT_ROOT="$(git rev-parse --show-toplevel)"
else
    PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

cd "$PROJECT_ROOT"

# 2. Configuration
PROJECT_NAME="xCxPxAx"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
# Requested naming: name, date and time
ARCHIVE_NAME="${PROJECT_NAME}_backup_${TIMESTAMP}.tar.gz"

# Backup destination: one before this folder (the parent directory)
DEST_DIR=".."
BACKUP_PATH="${DEST_DIR}/${ARCHIVE_NAME}"

echo "==> CulturePass Backup"
echo "    Project : $PROJECT_ROOT"
echo "    Target  : $BACKUP_PATH"
echo "    Time    : $(date)"
echo ""

# 3. Git snapshot
echo "[1/2] Git snapshot..."
if [ -d ".git" ]; then
    git add -A
    # Only commit if there are changes staged
    if ! git diff --cached --quiet; then
        git commit -m "chore: backup snapshot ${TIMESTAMP}"
        echo "      Snapshot committed."
    else
        echo "      Nothing to commit — working tree clean."
    fi
else
    echo "      Warning: .git directory not found."
fi

# 4. Create archive
echo "[2/2] Creating archive..."
tar -czf "$BACKUP_PATH" \
  --exclude='node_modules' \
  --exclude='.expo' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='*.log' \
  .

echo "      Archive created: $BACKUP_PATH"
echo ""
echo "==> Done."
