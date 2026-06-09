#!/usr/bin/env node
/**
 * Links GoogleService-Info.plist into the Xcode project (PBX resources build phase).
 * Run after google:sync or when adding ./GoogleService-Info.plist for the first time.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { IOSConfig } = require('@expo/config-plugins');
const { getPbxproj } = require('@expo/config-plugins/build/ios/utils/Xcodeproj');
const { getPBXProjectPath } = require('@expo/config-plugins/build/ios/Paths');

const ROOT = process.cwd();
const plistPath = path.join(ROOT, 'GoogleService-Info.plist');
const iosPlistPath = path.join(ROOT, 'ios/CulturePass/GoogleService-Info.plist');

function main() {
  if (!fs.existsSync(plistPath)) {
    if (fs.existsSync(iosPlistPath)) {
      fs.copyFileSync(iosPlistPath, plistPath);
      console.log(`Copied ${iosPlistPath} → ${plistPath}`);
    } else {
      console.error('Missing GoogleService-Info.plist — run: npm run google:sync');
      process.exit(1);
    }
  }

  const config = { ios: { googleServicesFile: './GoogleService-Info.plist' } };
  const project = getPbxproj(ROOT);
  const updated = IOSConfig.Google.setGoogleServicesFile(config, {
    projectRoot: ROOT,
    project,
  });

  const pbxprojPath = getPBXProjectPath(ROOT);
  fs.writeFileSync(pbxprojPath, updated.writeSync());
  console.log(`Linked GoogleService-Info.plist in ${pbxprojPath}`);
}

main();