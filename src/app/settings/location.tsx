import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useLayout } from '@/hooks/useLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { FontFamily, CultureTokens, ScreenTokens, Radius, Spacing } from '@/design-system/tokens/theme';
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';
import { M3Card } from '@/design-system/ui';
import { LocationPicker } from '@/modules/core/components';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

export default function SettingsLocationScreen() {
  const colors = useColors();
  const safeInsets = useSafeAreaInsetsWeb();
  const layout = useLayout();
  const reducedMotion = useReducedMotion();
  const { state } = useOnboarding();

  const currentLocation = state.city
    ? `${state.city}, ${state.country || 'Australia'}`
    : 'Not set yet';

  const isWide = layout.isDesktop || layout.isExpanded;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <M3TopAppBar
        title="Location & Region"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/settings'))}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 36, height: 36, borderRadius: 10, marginLeft: 4 }}
            contentFit="contain"
          />
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: safeInsets.bottom + Spacing.xl,
          paddingTop: ScreenTokens.topOffset,
          paddingHorizontal: isWide ? layout.hPad : Spacing.md,
        }}
      >
        <View style={[styles.contentShell, { maxWidth: isWide ? 860 : 680 }]}>
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(380)}>
            <M3Card style={styles.mainCard}>
              <View style={styles.mainCardContent}>
              {/* Current Location Status */}
              <View style={styles.statusRow}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '20' }]}>
                  <Ionicons name="location" size={26} color={colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.kicker, { color: colors.textTertiary }]}>YOUR ACTIVE REGION</Text>
                  <Text style={[styles.currentLocation, { color: colors.text }]} numberOfLines={1}>
                    {currentLocation}
                  </Text>
                </View>
                {state.city ? (
                  <View style={[styles.setChip, { backgroundColor: CultureTokens.teal + '15', borderColor: CultureTokens.teal + '30' }]}>
                    <Ionicons name="checkmark-circle" size={14} color={CultureTokens.teal} />
                    <Text style={{ fontSize: 11, fontFamily: FontFamily.bold, color: CultureTokens.teal }}>Active</Text>
                  </View>
                ) : null}
              </View>

              <Text style={[styles.impactLine, { color: colors.textSecondary }]}>
                This powers personalized discovery, nearby events, Culture Hubs, and marketplace results across the entire app.
              </Text>

              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

              {/* Change Section */}
              <View style={{ gap: 8 }}>
                <Text style={[styles.changeTitle, { color: colors.text }]}>Update your location</Text>
                <Text style={[styles.changeHint, { color: colors.textTertiary }]}>
                  Select your country, then narrow down to a region or city. You can always change this later.
                </Text>
              </View>

              <View style={styles.pickerMount}>
                <LocationPicker block />
              </View>
            </View>
          </M3Card>
          </Animated.View>

          {/* Helpful footer */}
          <View style={styles.footerNote}>
            <View style={[styles.footerIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.footerNoteText, { color: colors.textTertiary }]}>
              Changes apply instantly everywhere — no restart needed.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  contentShell: {
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.lg,
  },

  mainCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  mainCardContent: {
    padding: 24,
    gap: 20,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  summaryIcon: {
    width: 54,
    height: 54,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  kicker: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  currentLocation: {
    fontSize: 21,
    lineHeight: 26,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.2,
  },
  setChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },

  impactLine: {
    fontSize: 14.5,
    fontFamily: FontFamily.medium,
    lineHeight: 21,
  },

  divider: {
    height: 1,
    marginVertical: 4,
  },

  changeTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.1,
  },
  changeHint: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 19,
  },

  pickerMount: {
    width: '100%',
    marginTop: 4,
  },

  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  footerIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerNoteText: {
    fontSize: 13.5,
    flex: 1,
    fontFamily: FontFamily.medium,
    lineHeight: 19,
  },
});
