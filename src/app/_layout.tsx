import "react-native-reanimated"; // <-- CRUCIAL FIX: Must be at the very top
import { StatusBar } from "expo-status-bar";
import { Buffer } from "buffer";

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import Head from "expo-router/head";
import { router, Stack, usePathname, useRootNavigationState } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import posthogClient from '@/lib/analytics';
import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Platform,
  View,
  Text as RNText,
  StyleSheet,
  Pressable,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/modules/core/ui/ErrorBoundary";
import { queryClient, queryPersister } from "@/lib/query-client";
import { AuthProvider } from "@/lib/auth";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { SavedProvider } from "@/contexts/SavedContext";
import { LikesProvider } from "@/contexts/LikesContext";
import { ContactsProvider } from "@/contexts/ContactsContext";
import { LinearGradient } from "expo-linear-gradient";
import { gradients, CultureTokens } from "@/design-system/tokens/theme";
import { useColors, useIsDark } from "@/hooks/useColors";
import { useLayout } from "@/hooks/useLayout";
import { AuthGuard, AuthSyncBanner, DataSync } from "@/providers";
import { withAlpha } from "@/lib/withAlpha";
import { initializeWidgets } from "@/lib/widgets/register";
import { WidgetSync } from "@/components/WidgetSync";
import { WebSidebar } from "@/modules/core/layout/web/WebSidebar";
import { isCultureKeralaHost } from "@/lib/domainHost";
import { M3Button } from "@/design-system/ui";
import {
  APP_NAME,
  APP_WEB_DESCRIPTION,
  APP_WEB_KEYWORDS,
  APP_WEB_TITLE,
  APP_WEB_TAGLINE,
  SITE_ORIGIN,
} from "@/lib/app-meta";

import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from "@expo-google-fonts/poppins";
// Web font loader for Expo web is automatically handled by @expo-google-fonts

// Import LinkPreviewContextProvider if available
let LinkPreviewContextProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
try {
  // Try importing from expo-router if available in your version
  const linkPreviewModule = require('expo-router').LinkPreviewContextProvider;
  if (linkPreviewModule) {
    LinkPreviewContextProvider = linkPreviewModule;
  }
} catch (e) {
  // LinkPreviewContextProvider might not be available in your version
  console.warn('[RootLayout] LinkPreviewContextProvider not available:', (e as Error).message);
}

global.Buffer = Buffer;

// Suppress known noisy warnings that are not actionable.
if (typeof console !== 'undefined') {
  const _warn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    // React Native Web ≥0.19 deprecations (web only)
    if (Platform.OS === 'web') {
      if (msg.includes('props.pointerEvents is deprecated')) return;
      if (msg.includes('style props are deprecated')) return;
      if (msg.includes('style prop is deprecated')) return;
    }
    _warn(...args);
  };
}

// Prevent splash auto-hide safely
SplashScreen.preventAutoHideAsync().catch(() => {});

// ---------------------------------------------------------------------------
// Global Metadata Component
// ---------------------------------------------------------------------------
function GlobalMetadata({ pathname = '/' }: { pathname?: string }) {
  const isKeralaDomain = isCultureKeralaHost();
  const colors = useColors();
  const isDark = useIsDark();
  const isWeb = Platform.OS === 'web';

  const siteOrigin = isKeralaDomain ? 'https://culturekerala.com' : SITE_ORIGIN;
  const siteTitle = isKeralaDomain
    ? 'CultureKerala — Kerala & Malayalee Communities Worldwide'
    : APP_WEB_TITLE;
  const siteDescription = isKeralaDomain
    ? 'Discover Kerala and Malayalee communities, events, businesses, and culture around the world.'
    : APP_WEB_DESCRIPTION;
  const siteKeywords = isKeralaDomain
    ? 'CultureKerala, Kerala Communities, Malayalee, Malayalam, Kerala Events, Malayali Diaspora'
    : APP_WEB_KEYWORDS;

  const currentPath = pathname || '/';
  const canonicalUrl = `${siteOrigin}${currentPath === '/' ? '' : currentPath}`;
  const socialPreviewUrl = `${siteOrigin}/assets/images/social-preview.png`;

  const keralaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CultureKerala',
    url: 'https://culturekerala.com/',
    description: 'Discover Kerala and Malayalee communities, events, businesses, and culture around the world.',
    inLanguage: ['en', 'ml'],
    keywords: ['Kerala', 'Malayalee', 'Malayalam', 'Kerala events', 'Kerala communities'],
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://culturekerala.com/search?query={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const culturepassJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteOrigin}/#website`,
        name: APP_NAME,
        alternateName: APP_WEB_TAGLINE,
        url: siteOrigin + '/',
        description: siteDescription,
        inLanguage: 'en-AU',
        publisher: { '@id': `${siteOrigin}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteOrigin}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${siteOrigin}/#organization`,
        name: APP_NAME,
        url: siteOrigin + '/',
        description: siteDescription,
        slogan: APP_WEB_TAGLINE,
      },
    ],
  };

  return (
    <Head>
      <title>{siteTitle}</title>
      <meta name="description" content={siteDescription} />
      <meta name="keywords" content={siteKeywords} />
      <link rel="canonical" href={canonicalUrl} />
      {isKeralaDomain && <meta name="robots" content="index,follow,max-image-preview:large" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:image" content={socialPreviewUrl} />
      <meta property="og:site_name" content={isKeralaDomain ? 'CultureKerala' : APP_NAME} />
      <meta property="og:locale" content={isKeralaDomain ? 'ml_IN' : 'en_AU'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={siteDescription} />
      <meta name="twitter:image" content={socialPreviewUrl} />
      <meta name="application-name" content={isKeralaDomain ? 'CultureKerala' : APP_NAME} />
      <meta name="apple-mobile-web-app-title" content={isKeralaDomain ? 'CultureKerala' : APP_NAME} />

      {isWeb && (
        isKeralaDomain ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(keralaJsonLd) }}
          />
        ) : (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(culturepassJsonLd) }}
          />
        )
      )}

      <meta name="theme-color" content={colors.background} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content={isDark ? "black-translucent" : "default"}
      />
    </Head>
  );
}

// ---------------------------------------------------------------------------
// Manual Navigation Tracking for PostHog (since auto screen capture is disabled)
// ---------------------------------------------------------------------------
function NavigationTracker() {
  const pathname = usePathname();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog) {
      posthog.screen(pathname);
    }
  }, [pathname, posthog]);

  return null;
}

// ---------------------------------------------------------------------------
// Stack navigator — all screens registered here so Expo Router can deep-link
// ---------------------------------------------------------------------------
import { NavigationMetadata } from "@/components/NavigationMetadata";

// ...

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
        headerBackTitle: "",
        animation: Platform.OS === "web" ? "fade" : Platform.OS === "ios" ? "default" : "slide_from_right",
        ...(Platform.OS === "web"
          ? { contentStyle: { flex: 1, minHeight: 0 } }
          : {}),
      }}
    >
      <Stack.Screen name="(static)/landing" />
      <Stack.Screen name="kerala" />
      <Stack.Screen name="finder" />
      <Stack.Screen name="onboarding-canvas" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(domain)" />
      <Stack.Screen name="user/[id]" />

      <Stack.Screen name="profile/[id]" />
      <Stack.Screen name="profile/edit" />
      <Stack.Screen name="profile/public" />
      <Stack.Screen name="profile/qr" />

      <Stack.Screen name="payment/methods" />
      <Stack.Screen name="payment/transactions" />
      <Stack.Screen name="payment/wallet" />
      <Stack.Screen name="payment/success" />
      <Stack.Screen name="payment/cancel" />

      <Stack.Screen name="tickets/index" />
      <Stack.Screen name="tickets/[id]" />
      <Stack.Screen name="tickets/print/[id]" />
      <Stack.Screen name="saved/index" />
      <Stack.Screen name="perks/index" />
      <Stack.Screen name="perks/[id]" />

      <Stack.Screen name="scanner" />
      <Stack.Screen name="contacts/index" />
      <Stack.Screen name="contacts/[cpid]" />
      <Stack.Screen name="network/index" />
      <Stack.Screen name="CultureMarket" />
      <Stack.Screen name="CultureShop" />
      <Stack.Screen name="admin" />

      <Stack.Screen name="search/index" />
      <Stack.Screen name="notifications/index" />
      <Stack.Screen name="my-council" />
      <Stack.Screen name="map" />
      <Stack.Screen name="membership" />

      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/account" />
      <Stack.Screen name="settings/location" />
      <Stack.Screen name="settings/appearance" />
      <Stack.Screen name="settings/about" />
      <Stack.Screen name="settings/help" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/privacy" />
      <Stack.Screen name="settings/calendar-sync" />

      <Stack.Screen name="(static)/help/index" />
      <Stack.Screen name="(static)/contact" />
      <Stack.Screen name="(static)/legal/terms" />
      <Stack.Screen name="(static)/legal/privacy" />
      <Stack.Screen name="(static)/legal/cookies" />
      <Stack.Screen name="(static)/legal/guidelines" />

      <Stack.Screen name="updates/[id]" />

      <Stack.Screen name="[handle]" />

      <Stack.Screen name="(shortlinks)/c/[id]" options={{ animation: 'none' }} />
      <Stack.Screen name="(shortlinks)/c/[id]/members" options={{ animation: 'none' }} />
      <Stack.Screen name="(shortlinks)/e/[id]" options={{ animation: 'none' }} />
      <Stack.Screen name="(shortlinks)/b/[id]" options={{ animation: 'none' }} />
      <Stack.Screen name="(shortlinks)/u/[id]" options={{ animation: 'none' }} />
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Responsive web shell — centres content on wide screens, phone frame on small
// ---------------------------------------------------------------------------
function WebShell({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const navState = useRootNavigationState();
  const pathname = usePathname();

  const isReady = !!navState?.key;
  const isHome = isReady && (pathname === '/' || pathname === '/index');

  const mainColumn = (
    <View style={webStyles.contentContainer}>
      {isReady && !isHome && isDesktop && (
        <View style={[webStyles.topNav, { borderBottomColor: colors.borderLight }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ hovered }: any) => [
              webStyles.backBtn,
              hovered && { backgroundColor: colors.backgroundSecondary }
            ]}
          >
            <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
            <RNText style={[webStyles.backText, { color: colors.textSecondary }]}>Back</RNText>
          </Pressable>
        </View>
      )}
      <View style={[webStyles.mainFlex, isDesktop && webStyles.mainFlexDesktop]}>
        {children}
      </View>
    </View>
  );

  return (
    <View
      style={[
        webStyles.outerContainer,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <LinearGradient
        colors={[withAlpha(CultureTokens.indigo, 0.05), 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={webStyles.ambientMesh}
        pointerEvents="none"
      />
      {isDesktop ? (
        <>
          <WebSidebar />
          {mainColumn}
        </>
      ) : (
        mainColumn
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Root layout — provider order matters:
//   PersistQueryClientProvider (outermost)
//   └── LinkPreviewContextProvider (NEW - wraps Router)
//   └── OnboardingProvider
//   └── AuthProvider
//   └── DataSync (syncs auth user → onboarding state)
//   └── SavedProvider / ContactsProvider / ...
// ---------------------------------------------------------------------------

function RootLayoutContent() {
  const isDark = useIsDark();
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  // Add a timeout state to prevent indefinite loading
  const [fontTimeout, setFontTimeout] = React.useState(false);
  
  // Set a timeout after 3 seconds to allow the app to render with system fonts
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFontTimeout(true);
    }, 3000); // 3 seconds timeout
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Log font loading errors for debugging
  useEffect(() => {
    if (fontError) {
      console.error('[RootLayout] Font loading error:', fontError);
    }
  }, [fontError]);

  // On web, icons might be loaded separately or via CDN in some configs.
  // We separate them to see if they block the main fonts.
  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Load Ionicons font specifically if not web, as web often handles it via CSS
    }
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError || fontTimeout) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, fontTimeout]);

  useEffect(() => {
    if (fontsLoaded || fontError || fontTimeout) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, fontTimeout]);

  useEffect(() => {
    initializeWidgets();
  }, []);

  const isWeb = Platform.OS === "web";

  // If fonts fail to load OR timeout occurs, we still want to show the app instead of hanging on loading screen
  if (!fontsLoaded && !fontError && !fontTimeout) {
    if (__DEV__ && typeof window !== 'undefined') {
      console.log('[RootLayout] Waiting for fonts to load...', { fontsLoaded, fontError, fontTimeout });
    }
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? '#0B0B14' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <RNText style={{ color: isDark ? '#FFFFFF' : '#000000', fontSize: 16, marginBottom: 20 }}>
          Loading CulturePass...
        </RNText>
        {__DEV__ && (
          <M3Button variant="text" onPress={() => SplashScreen.hideAsync()}>
            Skip Font Wait (Dev Only)
          </M3Button>
        )}
      </View>
    );
  }

  // If fonts failed to load or timed out, log the issue but still render the app
  if (fontError || fontTimeout) {
    if (fontError) {
      console.warn('[RootLayout] Fonts failed to load, using system fonts as fallback:', fontError);
    } else if (fontTimeout) {
      console.warn('[RootLayout] Font loading timed out, using system fonts as fallback');
      SplashScreen.hideAsync().catch(() => {});
    }
  }

  const appShell = (
    <GestureHandlerRootView
      style={[
        { flex: 1 },
        Platform.OS === "web" && ({ minHeight: "100%", height: "100%" } as const),
      ]}
      onLayout={onLayoutRootView}
    >
      <StatusBar style={isDark ? "light" : "dark"} translucent />
      <DataSync />
      <WidgetSync />
      <AuthGuard />
      <AuthSyncBanner />
      {isWeb ? (
        <WebShell>
          <RootLayoutNav />
        </WebShell>
      ) : (
        <KeyboardProvider>
          <RootLayoutNav />
        </KeyboardProvider>
      )}
    </GestureHandlerRootView>
  );

  const queryAppTree = (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      {LinkPreviewContextProvider ? (
        <LinkPreviewContextProvider>
          <OnboardingProvider>
            <AuthProvider>
              <SavedProvider>
                <LikesProvider>
                  <ContactsProvider>
                    {posthogClient ? (
                      <PostHogProvider client={posthogClient} autocapture={{ captureScreens: false }}>{appShell}</PostHogProvider>
                    ) : (
                      appShell
                    )}
                  </ContactsProvider>
                </LikesProvider>
              </SavedProvider>
            </AuthProvider>
          </OnboardingProvider>
        </LinkPreviewContextProvider>
      ) : (
        <OnboardingProvider>
          <AuthProvider>
            <SavedProvider>
              <LikesProvider>
                <ContactsProvider>
                  {posthogClient ? (
                    <PostHogProvider client={posthogClient} autocapture={{ captureScreens: false }}>{appShell}</PostHogProvider>
                  ) : (
                    appShell
                  )}
                </ContactsProvider>
              </LikesProvider>
            </SavedProvider>
          </AuthProvider>
        </OnboardingProvider>
      )}
    </PersistQueryClientProvider>
  );

  return (
    <SafeAreaProvider style={Platform.OS === "web" ? ({ flex: 1, minHeight: 0 } as const) : undefined}>
      <ErrorBoundary>
        <Head.Provider>
          {queryAppTree}
        </Head.Provider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const webStyles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    // Do NOT set overflow:hidden here — on web it clips absolutely-positioned
    // modals, dropdowns, and popovers, blocking their touch events entirely.
    ...(Platform.OS !== "web" ? { overflow: "hidden" } as const : {}),
    ...(Platform.OS === "web" &&
      ({
        minHeight: "100%",
        height: "100%",
        maxHeight: "100%",
      } as const)),
  },
  ambientMesh: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  contentContainer: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    flexDirection: "column",
    alignSelf: "stretch",
  },
  topNav: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mainFlex: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    alignSelf: "stretch",
  },
  mainFlexDesktop: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
});

export default RootLayoutContent;
