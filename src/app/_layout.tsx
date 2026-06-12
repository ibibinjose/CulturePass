// IMPORTANT: This must be the absolute first import in the app.
// It forces React Native's Event before expo-notifications can pull in event-target-shim.
import '@/lib/fix-native-event-polyfill';

import "react-native-reanimated"; // <-- CRUCIAL FIX: Must be at the very top
import { StatusBar } from "expo-status-bar";
import { Buffer } from "buffer";

// Sentry - World class error & performance monitoring (initialized as early as possible)
import { initSentry } from "@/lib/sentry";

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack, usePathname, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { PostHogProvider } from 'posthog-react-native';
import posthogClient from '@/lib/analytics';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  View,
  Text as RNText,
  StyleSheet,
  Pressable,
  ScrollView,
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
import { CultureTokens } from "@/design-system/tokens/theme";
import { useColors, useIsDark } from "@/hooks/useColors";
import { useLayout } from "@/hooks/useLayout";
import { shouldHideMobileWebGlobalHeader } from "@/lib/mobileWebRoutes";
import { AuthGuard, AuthSyncBanner, DataSync, GoogleSignInBootstrap } from "@/providers";
import { withAlpha } from "@/lib/withAlpha";
import { initializeWidgets } from "@/lib/widgets/register";
import { WidgetSync } from "@/components/WidgetSync";
import { CulturalThemeProvider } from "@/providers/CulturalThemeProvider";
import { CulturePassWordmark } from "@/design-system/ui";
import { SIDEBAR_MAIN_NAV } from '@/constants/navigation/experienceNav';

import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import { Ionicons } from "@expo/vector-icons";

// Lazy load NavigationMetadata (web-only metadata injection, keeps it out of main entry on native)
const NavigationMetadata = React.lazy(() =>
  import("@/components/NavigationMetadata").then((mod) => ({ default: mod.NavigationMetadata }))
);

// Lazy load the heavy WebSidebar to keep it out of the main entry chunk on web
const WebSidebar = React.lazy(() =>
  import("@/modules/core/layout/web/WebSidebar").then((mod) => ({ default: mod.WebSidebar }))
);

initSentry();

// Import LinkPreviewContextProvider if available (lazy, after all static imports)
let LinkPreviewContextProvider: any = null;
/* eslint-disable @typescript-eslint/no-require-imports */
try {
  const mod = require('expo-router/build/link/preview/LinkPreviewContext');
  if (mod && mod.LinkPreviewContextProvider) {
    LinkPreviewContextProvider = mod.LinkPreviewContextProvider;
  }
} catch {
  try {
    const mod = require('expo-router');
    if (mod && mod.LinkPreviewContextProvider) {
      LinkPreviewContextProvider = mod.LinkPreviewContextProvider;
    }
  } catch {
    // optional dependency not present
  }
}
/* eslint-enable @typescript-eslint/no-require-imports */

global.Buffer = Buffer;

// Suppress known noisy warnings that are not actionable.
if (typeof console !== 'undefined') {
  const _warn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (Platform.OS === 'web') {
      if (msg.includes('props.pointerEvents is deprecated')) return;
      if (msg.includes('style props are deprecated')) return;
      if (msg.includes('style prop is deprecated')) return;
    }
    _warn(...args);
  };
}

// Prevent splash auto-hide safely
SplashScreen.preventAutoHideAsync().catch(() => { });

// ---------------------------------------------------------------------------
// Stack navigator — all screens registered here so Expo Router can deep-link
// ---------------------------------------------------------------------------
function RootLayoutNav() {
  const colors = useColors();
  const { isDesktop, width: screenWidth } = useLayout();
  const isWeb = Platform.OS === 'web';
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  const shouldShowDesktopLayout = isWeb && isDesktop;
  const showMobileWebHeader = isWeb && !shouldShowDesktopLayout && !shouldHideMobileWebGlobalHeader(pathname);

  const stackContent = (
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
      <Stack.Screen name="organiser/[id]" />
      <Stack.Screen name="profile/edit" />
      <Stack.Screen name="profile/public" />
      <Stack.Screen name="profile/digital-id" />
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

      <Stack.Screen name="updates/index" />
      <Stack.Screen name="updates/[id]" />
      <Stack.Screen name="enquiries/[id]" />
      <Stack.Screen name="dashboard/venue/index" />
      <Stack.Screen name="dashboard/sponsor/index" />
      <Stack.Screen name="dashboard/event-analytics/[eventId]" />

      <Stack.Screen name="[handle]" />

      <Stack.Screen name="(shortlinks)/c/[id]" options={{ animation: 'none' }} />
      <Stack.Screen name="(shortlinks)/c/[id]/members" options={{ animation: 'none' }} />
      <Stack.Screen name="(shortlinks)/e/[id]" options={{ animation: 'none' }} />
      <Stack.Screen name="(shortlinks)/b/[id]" options={{ animation: 'none' }} />
      <Stack.Screen name="(shortlinks)/o/[id]" options={{ animation: 'none' }} />
      <Stack.Screen name="(shortlinks)/p/[id]" options={{ animation: 'none' }} />
      <Stack.Screen name="(shortlinks)/m/[id]" options={{ animation: 'none' }} />
      <Stack.Screen name="(shortlinks)/u/[id]" options={{ animation: 'none' }} />
    </Stack>
  );

  const isAdminRoute = pathname?.startsWith('/admin');

  if (shouldShowDesktopLayout) {
    const contentStyle = isAdminRoute 
      ? ({ flex: 1, minWidth: 0, minHeight: 0, flexDirection: 'column', alignSelf: 'stretch', paddingHorizontal: 0 } as const)
      : webStyles.contentContainer;
    const mainStyle = isAdminRoute ? webStyles.mainFlex : [webStyles.mainFlex, webStyles.mainFlexDesktop];
    return (
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <React.Suspense fallback={null}>
          <NavigationMetadata />
        </React.Suspense>
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
          {!isAdminRoute && (
            <React.Suspense fallback={null}>
              <WebSidebar />
            </React.Suspense>
          )}
          <View style={contentStyle}>
            <View style={mainStyle}>
              {stackContent}
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (isWeb) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <React.Suspense fallback={null}>
          <NavigationMetadata />
        </React.Suspense>
        {showMobileWebHeader ? (
          <View
            style={[
              webStyles.mobileHeader,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.borderLight,
              },
            ]}
          >
            <Pressable
              onPress={() => setIsDrawerOpen(true)}
              style={({ pressed }) => [
                webStyles.burgerBtn,
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open navigation menu"
            >
              <Ionicons name="menu-outline" size={24} color={colors.text} />
            </Pressable>
            <CulturePassWordmark size="sm" showSuffix={true} />
            <View style={{ width: 40 }} />
          </View>
        ) : null}

        <View style={{ flex: 1 }}>
          {stackContent}
        </View>

        {isDrawerOpen && (
          <>
            <Pressable
              style={webStyles.drawerBackdrop}
              onPress={() => setIsDrawerOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close navigation menu"
            />
            <View
              style={[
                webStyles.drawerContent,
                { backgroundColor: colors.surface, borderRightColor: colors.borderLight },
              ]}
            >
              <View
                style={[
                  webStyles.drawerHeader,
                  { backgroundColor: colors.surface, borderBottomColor: colors.borderLight },
                ]}
              >
                <RNText style={[webStyles.drawerTitle, { color: colors.text }]}>Menu</RNText>
                <Pressable
                  onPress={() => setIsDrawerOpen(false)}
                  style={webStyles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close menu"
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView style={{ flex: 1 }}>
                {SIDEBAR_MAIN_NAV.map((item) => (
                  <Pressable
                    key={item.route}
                    style={({ pressed }) => [
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.borderLight,
                        opacity: pressed ? 0.6 : 1,
                      },
                    ]}
                    onPress={() => {
                      setIsDrawerOpen(false);
                      router.push(item.route as any);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    <Ionicons name={item.icon} size={20} color={colors.text} style={{ marginRight: 12 }} />
                    <RNText style={{ color: colors.text, fontSize: 15, fontFamily: 'Poppins_500Medium' }}>{item.label}</RNText>
                  </Pressable>
                ))}

                <View style={{ height: 24 }} />
                <Pressable
                  style={{ padding: 16 }}
                  onPress={() => {
                    setIsDrawerOpen(false);
                    router.push('/menu');
                  }}
                >
                  <RNText style={{ color: colors.primary || colors.text, fontSize: 14 }}>More • Settings &amp; Host</RNText>
                </Pressable>
              </ScrollView>
            </View>
          </>
        )}
      </View>
    );
  }

  return stackContent;
}

// ---------------------------------------------------------------------------
// Main Render Core — Wraps setup and maps contexts down safely
// ---------------------------------------------------------------------------
function AppShellWrapper({ onLayoutRootView }: { onLayoutRootView: () => void }) {
  const isDark = useIsDark();
  const isWeb = Platform.OS === "web";

  return (
    <GestureHandlerRootView
      style={[
        { flex: 1 },
        isWeb && ({ minHeight: "100%", height: "100%" } as const),
      ]}
      onLayout={onLayoutRootView}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <DataSync />
      <GoogleSignInBootstrap />
      <WidgetSync />
      <AuthGuard />
      <AuthSyncBanner />
      {isWeb ? (
        <RootLayoutNav />
      ) : (
        <KeyboardProvider>
          <RootLayoutNav />
        </KeyboardProvider>
      )}
    </GestureHandlerRootView>
  );
}

function RootLayoutContent() {
  const isDark = useIsDark();
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_700Bold,
    ...Ionicons.font,
  });

  const [fontTimeout, setFontTimeout] = useState(false);
  const FONT_TIMEOUT_MS = Platform.OS === 'web' ? 5500 : 4200;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!fontsLoaded) {
        setFontTimeout(true);
        console.warn(`[RootLayout] Font loading timed out after ${FONT_TIMEOUT_MS}ms — using system fonts as fallback`);
      }
    }, FONT_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [fontsLoaded, FONT_TIMEOUT_MS]);

  useEffect(() => {
    if (fontError) {
      console.error('[RootLayout] Font loading error:', fontError);
    }
  }, [fontError]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError || fontTimeout) {
      await SplashScreen.hideAsync().catch(() => { });
    }
  }, [fontsLoaded, fontError, fontTimeout]);

  useEffect(() => {
    if (fontsLoaded || fontError || fontTimeout) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [fontsLoaded, fontError, fontTimeout]);

  useEffect(() => {
    initializeWidgets();
  }, []);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || (!fontsLoaded && !fontError && !fontTimeout)) {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? '#0B0B14' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <RNText style={{ color: isDark ? '#FFFFFF' : '#000000', fontSize: 16, marginBottom: 20 }}>
          Loading CulturePass...
        </RNText>
      </View>
    );
  }

  if (fontError || fontTimeout) {
    if (fontError) {
      console.warn('[RootLayout] Fonts failed to load, using system fonts as fallback:', fontError);
    } else if (fontTimeout) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }

  const queryAppTree = (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      <OnboardingProvider>
        <AuthProvider>
          <SavedProvider>
            <LikesProvider>
              <ContactsProvider>
                <CulturalThemeProvider>
                  {posthogClient ? (
                    <PostHogProvider client={posthogClient} autocapture={{ captureScreens: false }}>
                      <AppShellWrapper onLayoutRootView={onLayoutRootView} />
                    </PostHogProvider>
                  ) : (
                    <AppShellWrapper onLayoutRootView={onLayoutRootView} />
                  )}
                </CulturalThemeProvider>
              </ContactsProvider>
            </LikesProvider>
          </SavedProvider>
        </AuthProvider>
      </OnboardingProvider>
    </PersistQueryClientProvider>
  );

  return (
    <SafeAreaProvider style={Platform.OS === "web" ? ({ flex: 1, minHeight: 0 } as const) : undefined}>
      <ErrorBoundary>
        {LinkPreviewContextProvider ? (
          <LinkPreviewContextProvider>
            {queryAppTree}
          </LinkPreviewContextProvider>
        ) : (
          queryAppTree
        )}
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const webStyles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    ...(Platform.OS !== "web" ? { overflow: "hidden" } as const : {}),
    ...(Platform.OS === "web" &&
      ({
        minHeight: "100%",
        height: "100%",
        maxHeight: "100%",
      } as const)),
  },
  ambientMesh: {
    ...StyleSheet.absoluteFill,
    opacity: 0.1,
  },
  contentContainer: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    flexDirection: "column",
    alignSelf: "stretch",
    paddingHorizontal: 16,
    ...(Platform.OS === "web" && {
      paddingHorizontal: 24,
    }),
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
  mobileHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        zIndex: 100,
      } as any,
      default: {},
    }),
  },
  burgerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  mobileHeaderTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    letterSpacing: -0.5,
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 999,
  },
  drawerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 230,
    borderRightWidth: 1,
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: '4px 0 16px rgba(0,0,0,0.15)',
      } as any,
      default: {},
    }),
  },
  drawerHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  drawerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
});

export default RootLayoutContent;