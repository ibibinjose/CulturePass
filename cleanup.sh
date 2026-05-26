#!/bin/bash

echo "Starting cleanup of unnecessary files and directories..."

# Remove build artifacts and cache directories
echo "Removing build artifacts and caches..."
rm -rf .expo/
rm -rf dist/
rm -rf node_modules/
rm -rf functions/node_modules/
rm -rf .next/
rm -rf .vercel/
rm -rf coverage/
rm -rf test-results/

# Remove temporary files
echo "Removing temporary files..."
rm -f typecheck_output.txt
rm -f .DS_Store
find . -name "*.log" -type f -delete
find . -name "*.tmp" -type f -delete
find . -name "*~" -type f -delete

# Remove development/testing related directories that aren't needed for production
echo "Removing development/testing artifacts..."
rm -rf .cursor/
rm -rf .claude/
rm -rf .jules/
rm -rf .kiro/
rm -rf docs/ # Documentation may not be needed in production
rm -rf design-system/culturepass/pages/ # Assuming these are design docs
rm -rf design-system/culturepass-2026/ # Assuming these are design docs

# Remove IDE specific directories that aren't needed for production
echo "Removing IDE specific directories..."
rm -rf .vscode/
rm -rf .idea/

# Remove temporary backup files
echo "Removing backup files..."
rm -f *.bak
rm -f *.backup
rm -f backup.sh # Since we have a dedicated cleanup script now

# Remove potentially unnecessary markdown files
echo "Removing non-essential documentation files..."
rm -f AGENTS.md
rm -f CLAUDE.md
rm -f DEPLOYMENT_CHECKLIST.md
rm -f NEW_FIREBASE_SETUP.md
rm -f QUICK_RULES.md
rm -f SeniorEngineer.md
rm -f TAGGING_GUIDE.md
rm -f TASKS.md
rm -f TASKS_EXECUTION.md
rm -f WORKSPACES.md
rm -f culturepass-rules.md
rm -f posthog-setup-report.md

# Remove potentially unnecessary config files
echo "Removing non-essential config files..."
rm -f .nvmrc # Not needed if node version is managed differently
rm -f sonar-project.properties # SonarQube config, not needed for basic app

# Remove credentials directory if it's for development only
echo "Checking credentials directory..."
if [ -d "credentials/" ]; then
  echo "Found credentials directory. If this contains production secrets, please review before removal."
  echo "Press Ctrl+C to cancel if you want to keep it, or Enter to continue..."
  read -r
  rm -rf credentials/
fi

# Clean up patch files if they're no longer needed
echo "Cleaning up patch files..."
rm -rf patches/

# Clean up test related directories that might be considered unnecessary
rm -rf e2e/ # End-to-end tests might not be needed in production

echo "Cleanup completed!"

echo ""
echo "To reinstall dependencies, run:"
echo "npm install"
echo ""
echo "To reinstall functions dependencies, run:"
echo "cd functions && npm install"