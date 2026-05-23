#!/usr/bin/env node

const { execSync } = require("node:child_process");

const emergencyBypass = process.env.LEGACY_COMPONENTS_EMERGENCY === "1";
if (emergencyBypass) {
  process.exit(0);
}

function run(command) {
  return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

let mergeBase;
try {
  const baseRef = process.env.LEGACY_BASE_REF || "origin/main";
  mergeBase = run(`git merge-base HEAD ${baseRef}`);
} catch {
  mergeBase = run("git rev-parse HEAD~1");
}

const changedFiles = run(`git diff --name-only ${mergeBase}...HEAD`)
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const legacyChanges = changedFiles.filter((file) => file.startsWith("src/components/"));
if (legacyChanges.length === 0) {
  process.exit(0);
}

const message = [
  "Legacy components freeze is active.",
  "New work under src/components/* is blocked unless this is an emergency patch.",
  "",
  "Changed legacy files:",
  ...legacyChanges.map((file) => `- ${file}`),
  "",
  "If this is an emergency patch, rerun with LEGACY_COMPONENTS_EMERGENCY=1.",
].join("\n");

console.error(message);
process.exit(1);
