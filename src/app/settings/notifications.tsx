import { View, Text, StyleSheet, ScrollView, Platform, Switch } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily, ScreenTokens } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';
import { goBackOrReplace } from '@/lib/navigation';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { Stack } from 'expo-router';
import { api } from '@/lib/api';

const NOTIFICATION_SETTINGS = [
  { key: 'eventReminders',    title: 'Event Reminders',        description: "Upcoming events you're interested in or have tickets for",           icon: 'calendar'     as const, color: (colors: any) => colors.primary },
  { key: 'communityUpdates',  title: 'Community Updates',      description: 'New posts, events, and announcements from your communities',         icon: 'people'       as const, color: CultureTokens.teal },
  { key: 'perkAlerts',        title: 'Perk Alerts',            description: 'New perks, discounts, and exclusive offers',                         icon: 'gift'         as const, color: CultureTokens.gold },
  { key: 'marketingEmails',   title: 'Marketing Emails',       description: 'Newsletters, promotions, and personalised recommendations by email',  icon: 'mail'         as const, color: CultureTokens.coral },
  { key: 'weeklyDigestEmail', title: 'Weekly Cultural Digest', description: 'Monday morning email with your top cultural events for the week',    icon: 'mail-unread'  as const, color: CultureTokens.indigo, privacyKey: true },
];

export default function NotificationSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const [settings, setSettings] = useState<Record<string, boolean>>({
    eventReminders:    true,
    communityUpdates:  true,
    perkAlerts:        true,
    marketingEmails:   false,
    weeklyDigestEmail: true,
  });

  const toggle = (key: string, isPrivacyKey?: boolean) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !settings[key];
    setSettings(prev => ({ ...prev, [key]: next }));
    if (isPrivacyKey) {
      api.privacy.update({ [key]: next } as any).catch(() => {
        // Revert on failure
        setSettings(prev => ({ ...prev, [key]: !next }));
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[`${colors.primary}08`, 'transparent']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <M3TopAppBar
        title="Notifications"
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
        contentContainerStyle={{ paddingBottom: 60 + bottomInset, paddingTop: ScreenTokens.topOffset }}
      >
        <View style={[styles.contentShell, { paddingHorizontal: 16 }]}>
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(400)}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>PREFERENCES</Text>
            <GlassView contentStyle={{ padding: 4 }}>
              {NOTIFICATION_SETTINGS.map((item, i) => {
                const resolvedColor = typeof item.color === 'function' ? item.color(colors) : item.color;
                return (
                  <View key={item.key}>
                    <View style={styles.settingRow}>
                      <View style={[styles.settingIcon, { backgroundColor: resolvedColor + '12' }]}>
                        <Ionicons name={item.icon as any} size={20} color={resolvedColor} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>{item.title}</Text>
                        <Text style={[styles.settingDesc, { color: colors.textTertiary }]} numberOfLines={2}>{item.description}</Text>
                      </View>
                      <Switch
                        value={settings[item.key]}
                        onValueChange={() => toggle(item.key, (item as any).privacyKey)}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor={colors.border}
                      />
                    </View>
                    {i < NOTIFICATION_SETTINGS.length - 1 && <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />}
                  </View>
                );
              })}
            </GlassView>
          </Animated.View>

          <View style={styles.note}>
            <Ionicons name="information-circle" size={18} color={colors.textTertiary} />
            <Text style={[styles.noteText, { color: colors.textTertiary }]}>
              Critical account and security notifications are always sent regardless of these preferences.
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
  sectionTitle: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2, marginLeft: 12, marginBottom: 12 },

  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 16 },
  settingIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 15, lineHeight: 21, fontFamily: FontFamily.semibold },
  settingDesc: { fontSize: 12, fontFamily: FontFamily.regular, width: '85%' },
  divider: { height: 1, marginLeft: 76 },

  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 12, marginTop: 12 },
  noteText: { fontSize: 13, flex: 1, lineHeight: 18 },
});
