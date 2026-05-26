import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { FontFamily, ScreenTokens } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';
import { goBackOrReplace } from '@/lib/navigation';
import { useAppAppearance, type AppearancePreference } from '@/hooks/useAppAppearance';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

const OPTIONS: {
  key: AppearancePreference;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'system', title: 'System', subtitle: 'Automatically match your device theme', icon: 'phone-portrait' },
  { key: 'dark', title: 'Dark', subtitle: 'Premium black-first look', icon: 'moon' },
  { key: 'light', title: 'Light', subtitle: 'Bright surfaces with strong contrast', icon: 'sunny' },
];

export default function AppearanceSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { preference, resolvedScheme, setPreference } = useAppAppearance();
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const onPick = async (next: AppearancePreference) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setPreference(next);
  };

  const resolvedLabel = resolvedScheme === 'dark' ? 'Dark' : 'Light';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[`${colors.primary}08`, 'transparent']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <M3TopAppBar
        title="Appearance"
        onBack={() => goBackOrReplace('/settings')}
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
        contentContainerStyle={{
          paddingBottom: 60 + bottomInset,
          paddingTop: ScreenTokens.topOffset,
        }}
      >
        <View style={[styles.contentShell, { paddingHorizontal: 16 }]}>
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>PREVIEW</Text>
            <GlassView contentStyle={{ padding: 20 }}>
              <View style={styles.previewHeader}>
                <GlassView intensity={10} style={[styles.previewModeBadge, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '20' }]}>
                  <Ionicons
                    name={resolvedScheme === 'dark' ? 'moon' : 'sunny'}
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={[styles.previewModeText, { color: colors.primary }]}>
                    Active: {resolvedLabel}
                  </Text>
                </GlassView>
              </View>
              <View style={[styles.previewCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                <Text style={[styles.previewTitle, { color: colors.text }]}>Liquid Glass Preview</Text>
                <Text style={[styles.previewSub, { color: colors.textSecondary }]}>
                  The UI surfaces update instantly to match your selected preference.
                </Text>
                <View style={[styles.previewChip, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '15' }]}>
                  <Text style={[styles.previewChipText, { color: colors.primary }]}>Surface Token</Text>
                </View>
              </View>
            </GlassView>
          </Animated.View>

          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(100).duration(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>THEME PREFERENCE</Text>
            <GlassView contentStyle={{ padding: 4 }}>
              {OPTIONS.map((opt, i) => {
                const selected = preference === opt.key;
                return (
                  <View key={opt.key}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.optionRow,
                        { backgroundColor: pressed ? colors.primarySoft : 'transparent' },
                        Platform.OS === 'web' && { cursor: 'pointer' as any },
                      ]}
                      onPress={() => {
                        void onPick(opt.key);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <View style={[styles.optionIcon, { backgroundColor: colors.primarySoft }]}>
                        <Ionicons name={opt.icon as any} size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.optionTitle, { color: colors.text }]}>{opt.title}</Text>
                        <Text style={[styles.optionSub, { color: colors.textTertiary }]}>{opt.subtitle}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 8 }}>
                        {selected ? (
                           <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                        ) : (
                           <Ionicons name="ellipse-outline" size={24} color={colors.border} />
                        )}
                      </View>
                    </Pressable>
                    {i < OPTIONS.length - 1 && <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />}
                  </View>
                );
              })}
            </GlassView>
          </Animated.View>

          <View style={styles.note}>
            <Ionicons name="information-circle" size={18} color={colors.textTertiary} />
            <Text style={[styles.noteText, { color: colors.textTertiary }]}>
              Using <Text style={{ color: colors.text, fontFamily: FontFamily.bold }}>{resolvedLabel}</Text> mode. picking System allows CulturePass to match your OS theme automatically.
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
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2, marginLeft: 12, marginBottom: 12 },

  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 16 },
  optionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 16, fontFamily: FontFamily.bold },
  optionSub: { fontSize: 12, fontFamily: FontFamily.regular, width: '90%' },
  divider: { height: 1, marginLeft: 76 },

  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 12, marginTop: 8 },
  noteText: { fontSize: 13, flex: 1, lineHeight: 18 },

  previewHeader: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 16 },
  previewModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  previewModeText: { fontSize: 11, fontFamily: FontFamily.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  previewCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 8 },
  previewTitle: { fontSize: 17, fontFamily: FontFamily.bold },
  previewSub: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 20 },
  previewChip: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  previewChipText: { fontSize: 11, fontFamily: FontFamily.bold, textTransform: 'uppercase' },
});
