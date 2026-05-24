/**
 * CulturePass Deep Link Testing Suite
 * Validates Universal Links (iOS) and App Links (Android) configuration.
 */

const TEST_ROUTES = [
  'https://culturepass.app/',
  'https://culturepass.app/e/CP-EVT-101',
  'https://culturepass.app/c/c1',
  'culturepass://e/CP-EVT-101',
];

console.log('🧪 Starting Deep Link configuration check...');



function verifyAppJson() {
  console.log('\n--- 2. App.config.js Verification ---');
  const getAppConfig = require('../../app.config.js').default;
  const appConfig = getAppConfig({ config: { expo: {} } });
  const expoConfig = appConfig.expo;
  
  if (expoConfig.scheme !== 'culturepass') {
    throw new Error('❌ Missing scheme "culturepass" in app.config.js');
  }
  console.log('✅ Custom Scheme verified (culturepass://)');

  const iosDomains = expoConfig.ios.associatedDomains || [];
  if (!iosDomains.includes('applinks:culturepass.app')) {
    throw new Error('❌ Missing applinks:culturepass.app in iOS associatedDomains');
  }
  console.log('✅ iOS Universal Links verified (associatedDomains)');

  const androidIntents = expoConfig.android.intentFilters || [];
  const hasAppLinks = androidIntents.some((intent: any) => {
    return intent.data?.some((data: any) => data.host === 'culturepass.app' && data.scheme === 'https');
  });
  
  if (!hasAppLinks) {
    throw new Error('❌ Missing https://culturepass.app intent filter for Android');
  }
  console.log('✅ Android App Links verified (intentFilters)');
}

try {
  verifyAppJson();
  console.log('\n✨ All Deep Link configurations are correct and validated.');
} catch (error) {
  console.error(error);
  process.exit(1);
}
