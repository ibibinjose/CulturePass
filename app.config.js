/**
 * Expo app configuration with conditional plugin loading
 * 
 * The react-native-maps plugin causes build errors on web platform
 * due to iOS-specific plugin functions not being available.
 * This configuration conditionally applies the maps plugin only
 * for native builds (iOS/Android).
 */

// Check if we're running in a web environment by inspecting command line arguments
const isWebEnvironment = process.argv.some(arg => 
  arg.includes('web') || 
  (process.argv[process.argv.indexOf(arg) - 1] === '--platform' && arg === 'web')
);

// If the platform is being specified as web, or if 'web' is in the arguments, exclude react-native-maps
const shouldExcludeMapsPlugin = isWebEnvironment || 
  process.argv.includes('web') || 
  (process.argv.includes('--platform') && process.argv[process.argv.indexOf('--platform') + 1] === 'web');

const stripeMerchantIdentifier = process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER || "merchant.au.culturepass.app";
const stripeAndroidPayMode = process.env.EXPO_PUBLIC_STRIPE_ANDROID_PAY_MODE === "production" ? "production" : "test";

export default function(appConfig) {
  const { config } = appConfig || {};
  
  // Prepare plugins array conditionally
  const basePlugins = [
    [
      "expo-router",
      {
        origin: "https://culturepass.app"
      }
    ],
    [
      "@stripe/stripe-react-native",
      {
        merchantIdentifier: stripeMerchantIdentifier,
        androidPayMode: stripeAndroidPayMode
      }
    ],
    "expo-font",
    "expo-web-browser",
    "expo-apple-authentication",
    "expo-status-bar", // Added for SDK 56 compatibility (status bar configuration on web/native)
    [
      "@react-native-google-signin/google-signin/app.plugin.js",
      {
        iosUrlScheme: "com.googleusercontent.apps.$(EXPO_PUBLIC_GOOGLE_REVERSED_CLIENT_ID)"
      }
    ],
    "expo-secure-store",
    "expo-local-authentication",
    [
      "expo-location",
      {
        locationWhenInUsePermission: "CulturePass uses your location to show events and communities near you."
      }
    ],
    "expo-notifications",
    [
      "expo-calendar",
      {
        calendarPermission: "CulturePass accesses your calendar to sync cultural events you're attending.",
        remindersPermission: "CulturePass uses Reminders to add event alerts to your schedule."
      }
    ],
    [
      "expo-camera",
      {
        cameraPermission: "CulturePass uses the camera to scan event QR codes and update your profile photo."
      }
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "CulturePass accesses your photo library to update your profile photo and event images.",
        cameraPermission: "CulturePass uses the camera to update your profile photo and scan event tickets."
      }
    ],
    "expo-localization",
    // Temporarily disabled due to prebuild --clean failure (see REBUILD.md)
    // "@bacons/apple-targets",
    [
      "react-native-maps",
      {
        iosGoogleMapsApiKey: "$(EXPO_PUBLIC_GOOGLE_MAPS_KEY)"
      }
    ],
    "@react-native-community/datetimepicker",
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "16.4"
        },
        android: {
          minSdkVersion: 26,
          targetSdkVersion: 35,
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true
        }
      }
    ],
    "expo-image",
    [
      "expo-widgets",
      {
        bundleIdentifier: "au.culturepass.app.widgets",
        groupIdentifier: "group.au.culturepass.app",
        widgets: [
          {
            name: "CultureSpotlightWidget",
            supportedFamilies: [
              "systemSmall",
              "systemMedium",
              "accessoryCircular",
              "accessoryRectangular",
              "accessoryInline"
            ],
            displayName: "Culture Spotlight",
            description: "Featured culture and picks from CulturePass.",
            contentMarginsDisabled: false
          },
          {
            name: "CultureNearYouWidget",
            supportedFamilies: [
              "systemSmall",
              "systemMedium",
              "accessoryCircular",
              "accessoryRectangular",
              "accessoryInline"
            ],
            displayName: "Near You",
            description: "Upcoming cultural events in your city.",
            contentMarginsDisabled: false
          },
          {
            name: "CultureIdentityQRWidget",
            supportedFamilies: [
              "systemSmall",
              "systemMedium",
              "accessoryCircular",
              "accessoryRectangular",
              "accessoryInline"
            ],
            displayName: "Culture ID",
            description: "Your CulturePass member details.",
            contentMarginsDisabled: false
          },
          {
            name: "CultureUpcomingTicketWidget",
            supportedFamilies: [
              "systemSmall",
              "systemMedium",
              "accessoryCircular",
              "accessoryRectangular",
              "accessoryInline"
            ],
            displayName: "Next Ticket",
            description: "Your next ticket — open the app for the full QR.",
            contentMarginsDisabled: false
          },
          {
            name: "CulturePassWatchWidget",
            supportedFamilies: [
              "accessoryCircular",
              "accessoryRectangular",
              "accessoryInline"
            ],
            displayName: "CulturePass Glance",
            description: "Ultra-compact next event or ticket for Lock Screen and Apple Watch.",
            contentMarginsDisabled: false
          },
          {
            name: "CultureMembershipWidget",
            supportedFamilies: [
              "systemSmall",
              "systemMedium",
              "accessoryCircular",
              "accessoryRectangular"
            ],
            displayName: "Membership",
            description: "Your CulturePass+ tier, renewal date, and cashback balance.",
            contentMarginsDisabled: false
          }
        ]
      }
    ]
  ];

  return {
    ...config,
    expo: {
      ...config.expo,
      plugins: [
        ...basePlugins,
        [
          "@sentry/react-native",
          {
            // These are required for automatic source map uploads during EAS builds
            organization: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,

            // Enable Hermes sourcemap support for native iOS/Android builds
            hermes: true,

            // Note: For full native Hermes sourcemap uploads in cloud EAS builds,
            // set SENTRY_AUTH_TOKEN as an EAS secret so the plugin can upload automatically.
          },
        ],
      ],
      name: "CulturePass",
      slug: "culturepass",
      version: "1.3.0",
      description: "Discover cultural events and communities built for diaspora cities. Organizers reach the right audience; attendees find festivals, tickets, and belonging in one place.",
      orientation: "portrait",
      icon: "./assets/images/icon.png",
      scheme: "culturepass",
      userInterfaceStyle: "automatic",
      splash: {
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#0B0B14"
      },
      ios: {
        supportsTablet: true,
        bundleIdentifier: "au.culturepass.app",
        buildNumber: "27",
        appleTeamId: "26WGXSNG58",
        entitlements: {
          "com.apple.developer.in-app-payments": [
            stripeMerchantIdentifier
          ],
          "com.apple.security.application-groups": [
            "group.au.culturepass.app"
          ]
        },
        infoPlist: {
          NSSupportsLiveActivities: true,
          NSLocationWhenInUseUsageDescription: "CulturePass uses your location to show events and communities near you.",
          NSCameraUsageDescription: "CulturePass uses the camera to update your profile photo and scan event tickets.",
          NSPhotoLibraryUsageDescription: "CulturePass accesses your photo library to update your profile photo.",
          NSPhotoLibraryAddUsageDescription: "CulturePass saves images to your photo library.",
          NSContactsUsageDescription: "CulturePass accesses your contacts to help you connect with friends on the platform.",
          NSFaceIDUsageDescription: "CulturePass uses Face ID for quick and secure sign-in.",
          ITSAppUsesNonExemptEncryption: false,
          UIBackgroundModes: [
            "fetch",
            "remote-notification"
          ]
        },
        config: {
          // Key moved to react-native-maps plugin props
        },
        associatedDomains: [
          "applinks:culturepass.app",
          "applinks:www.culturepass.app",
          "webcredentials:culturepass.app"
        ],
        privacyManifests: {
          NSPrivacyAccessedAPITypes: [
            {
              NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
              NSPrivacyAccessedAPITypeReasons: [
                "CA92.1"
              ]
            }
          ]
        }
      },
      android: {
        package: "au.culturepass.app",
        splash: {
          image: "./assets/images/splash-icon.png",
          resizeMode: "contain",
          backgroundColor: "#0B0B14"
        },
        adaptiveIcon: {
          backgroundColor: "#0B0B14",
          foregroundImage: "./assets/images/android-icon-foreground.png",
          backgroundImage: "./assets/images/android-icon-background.png",
          monochromeImage: "./assets/images/android-icon-monochrome.png"
        },
        intentFilters: [
          {
            action: "VIEW",
            autoVerify: true,
            data: [
              {
                scheme: "https",
                host: "culturepass.app",
                pathPrefix: "/"
              }
            ],
            category: [
              "BROWSABLE",
              "DEFAULT"
            ]
          },
          {
            action: "VIEW",
            data: [
              {
                scheme: "culturepass"
              }
            ],
            category: [
              "BROWSABLE",
              "DEFAULT"
            ]
          }
        ],
        permissions: [
          "CAMERA",
          "ACCESS_FINE_LOCATION",
          "ACCESS_COARSE_LOCATION",
          "READ_EXTERNAL_STORAGE",
          "VIBRATE",
          "android.permission.ACCESS_COARSE_LOCATION",
          "android.permission.ACCESS_FINE_LOCATION",
          "android.permission.CAMERA",
          "android.permission.RECORD_AUDIO",
          "android.permission.READ_CALENDAR",
          "android.permission.WRITE_CALENDAR",
          "android.permission.USE_BIOMETRIC",
          "android.permission.USE_FINGERPRINT",
          "android.permission.READ_MEDIA_IMAGES"
        ],
        versionCode: 6
      },
      web: {
        favicon: "./assets/images/favicon.png",
        name: "CulturePass — Belong anywhere.",
        shortName: "CulturePass",
        description: "Connecting global diaspora communities through cultural events, festivals, and shared belonging. Discover your city, connect with your roots.",
        lang: "en-AU",
        themeColor: "#0B0B14",
        backgroundColor: "#0B0B14",
        display: "standalone",
        orientation: "portrait",
        bundler: "metro",
        output: "static"
      },
      experiments: {
        typedRoutes: false,
        reactCompiler: false
      },
      extra: {
        router: {
          origin: "https://culturepass.app"
        },
        eas: {
          projectId: "9dc511ee-ee3e-4798-ae29-30efc8f5343e"
        },
        // Sentry DSN - loaded at runtime via EXPO_PUBLIC_SENTRY_DSN or this fallback
        sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      },
      owner: "cultureos",
      runtimeVersion: "1.3.0",
      updates: {
        url: "https://u.expo.dev/9dc511ee-ee3e-4798-ae29-30efc8f5343e"
      }
    }
  };
};
