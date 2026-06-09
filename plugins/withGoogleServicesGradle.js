/**
 * Ensures the Google Services Gradle plugin and Firebase BoM are present after expo prebuild.
 * Required for google-services.json → native Firebase / Google Sign-In on Android.
 */

const {
  withProjectBuildGradle,
  withAppBuildGradle,
} = require('@expo/config-plugins');

const GOOGLE_SERVICES_VERSION = '4.4.4';
const FIREBASE_BOM_VERSION = '34.14.0';

function withGoogleServicesProjectGradle(config) {
  return withProjectBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;
    const classpath = `classpath('com.google.gms:google-services:${GOOGLE_SERVICES_VERSION}')`;

    if (!contents.includes('com.google.gms:google-services')) {
      contents = contents.replace(
        /dependencies\s*\{/,
        `dependencies {
    ${classpath}`,
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });
}

function withGoogleServicesAppGradle(config) {
  return withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;

    if (!contents.includes('com.google.gms.google-services')) {
      contents += '\napply plugin: "com.google.gms.google-services"\n';
    }

    if (!contents.includes('com.google.firebase:firebase-bom')) {
      contents = contents.replace(
        /dependencies\s*\{/,
        `dependencies {
    implementation platform('com.google.firebase:firebase-bom:${FIREBASE_BOM_VERSION}')
    implementation 'com.google.firebase:firebase-analytics'`,
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });
}

function withGoogleServicesGradle(config) {
  config = withGoogleServicesProjectGradle(config);
  config = withGoogleServicesAppGradle(config);
  return config;
}

module.exports = withGoogleServicesGradle;