import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { FontFamily, CultureTokens, ScreenTokens } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';
import { LocationPicker } from '@/modules/core/components';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

export default function SettingsLocationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const { state } = useOnboarding();
  const currentLocation = state.city ? `${state.city}, ${state.country || 'Australia'}` : 'Not set';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[`${colors.primary}08`, 'transparent']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <M3TopAppBar
        title="Location"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/settings'))}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
            contentFit="contain"
          />
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 60 + bottomInset, paddingTop: ScreenTokens.topOffset }}
      >
        <View style={[styles.contentShell, { paddingHorizontal: 16 }]}>
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(400)}>
            <GlassView style={styles.mainPanel} contentStyle={{ padding: 24, gap: 20 }}>
                <View style={styles.statusRow}>
                    <View style={[styles.summaryIcon, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '15' }]}>
                        <Ionicons name="navigate" size={24} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.kicker, { color: colors.textTertiary }]}>ACTIVE REGION</Text>
                        <Text style={[styles.currentLocation, { color: colors.text }]}>{currentLocation}</Text>
                    </View>
                    {state.city ? (
                        <View style={[styles.setChip, { backgroundColor: CultureTokens.teal + '15', borderColor: CultureTokens.teal + '35' }]}>
                            <Text style={{ fontSize: 10, fontFamily: FontFamily.bold, color: CultureTokens.teal }}>SET</Text>
                        </View>
                    ) : null}
                </View>

                <Text style={[styles.impactLine, { color: colors.textSecondary }]}>
                Discovery rails, search results, and local community hubs follow this preference to show you what&apos;s on nearby.
                </Text>

                <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />

                <View style={{ gap: 6 }}>
                    <Text style={[styles.changeTitle, { color: colors.text }]}>Change location</Text>
                    <Text style={[styles.changeHint, { color: colors.textTertiary }]}>
                    Choose your country, then select a region or city. Search is available for global discovery.
                    </Text>
                </View>

                <View style={styles.pickerMount}>
                <LocationPicker block />
                </View>
            </GlassView>
          </Animated.View>

          <View style={styles.footerNote}>
            <Ionicons name="compass-outline" size={16} color={colors.textTertiary} />
            <Text style={[styles.footerNoteText, { color: colors.textTertiary }]}>
              Selected location updates instantly across the app.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 12,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleBlock: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 1.5, opacity: 0.8 },
  backBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  contentShell: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  mainPanel: { marginBottom: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  kicker: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    letterSpacing: 1,
  },
  currentLocation: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: FontFamily.bold,
    letterSpacing: 0,
  },
  setChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  impactLine: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    lineHeight: 20,
  },
  divider: {
    height: 1,
  },
  changeTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
  },
  changeHint: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
  pickerMount: {
    width: '100%',
    marginTop: 8,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  footerNoteText: {
    fontSize: 13,
    flex: 1,
    fontFamily: FontFamily.medium,
  },
});
