/**
 * NotificationPreferences Component
 *
 * In-app notification center and preference management for host profiles.
 * Allows users to configure notification channels (email, push, in-app)
 * per event type, manage digest settings, and set quiet hours.
 *
 * Requirements: 29 (Notification System)
 * - In-app notification center showing all profile-related notifications
 * - Configure notification preferences (email, push, in-app)
 * - Support push notifications on mobile for time-sensitive updates
 * - Batch non-urgent notifications into daily digest email
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Switch,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';

import {
  type HostNotificationPreferences,
  type ProfileNotificationEvent,
  type NotificationPreference,
  DEFAULT_NOTIFICATION_PREFERENCES,
  getDefaultPreferences,
  getEventLabel,
  getEventDescription,
} from '../services/notificationTriggers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotificationPreferencesProps {
  /** Current user ID */
  userId: string;
  /** Existing preferences (if loaded from backend) */
  initialPreferences?: HostNotificationPreferences;
  /** Callback when preferences are saved */
  onSave: (preferences: HostNotificationPreferences) => void;
  /** Whether save is in progress */
  saving?: boolean;
}

// ---------------------------------------------------------------------------
// Event category groupings for UI organization
// ---------------------------------------------------------------------------

interface EventGroup {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  events: ProfileNotificationEvent[];
}

const EVENT_GROUPS: EventGroup[] = [
  {
    title: 'Profile Status',
    description: 'Publishing and verification updates',
    icon: 'shield-checkmark',
    color: CultureTokens.teal,
    events: [
      'profile_published',
      'verification_required',
      'verification_approved',
      'verification_rejected',
      'verification_more_info',
    ],
  },
  {
    title: 'Compliance',
    description: 'Licence and certificate reminders',
    icon: 'document-text',
    color: CultureTokens.coral,
    events: ['licence_expiry_reminder'],
  },
  {
    title: 'Engagement',
    description: 'Milestones and performance insights',
    icon: 'trending-up',
    color: CultureTokens.indigo,
    events: ['engagement_milestone', 'performance_decline'],
  },
  {
    title: 'Reminders',
    description: 'Draft completion and activity prompts',
    icon: 'notifications',
    color: CultureTokens.violet,
    events: ['draft_reminder'],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationPreferences({
  userId,
  initialPreferences,
  onSave,
  saving = false,
}: NotificationPreferencesProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  const [preferences, setPreferences] = useState<HostNotificationPreferences>(
    initialPreferences || getDefaultPreferences(userId)
  );
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const hapticFeedback = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const toggleChannel = useCallback(
    (event: ProfileNotificationEvent, channel: 'email' | 'push' | 'inApp') => {
      hapticFeedback();
      setPreferences((prev) => ({
        ...prev,
        preferences: prev.preferences.map((p) =>
          p.event === event ? { ...p, [channel]: !p[channel] } : p
        ),
        updatedAt: new Date().toISOString(),
      }));
    },
    [hapticFeedback]
  );

  const toggleDigestOnly = useCallback(
    (event: ProfileNotificationEvent) => {
      hapticFeedback();
      setPreferences((prev) => ({
        ...prev,
        preferences: prev.preferences.map((p) =>
          p.event === event ? { ...p, digestOnly: !p.digestOnly } : p
        ),
        updatedAt: new Date().toISOString(),
      }));
    },
    [hapticFeedback]
  );

  const toggleDigestEnabled = useCallback(() => {
    hapticFeedback();
    setPreferences((prev) => ({
      ...prev,
      digestEnabled: !prev.digestEnabled,
      updatedAt: new Date().toISOString(),
    }));
  }, [hapticFeedback]);

  const toggleQuietHours = useCallback(() => {
    hapticFeedback();
    setPreferences((prev) => ({
      ...prev,
      quietHoursEnabled: !prev.quietHoursEnabled,
      updatedAt: new Date().toISOString(),
    }));
  }, [hapticFeedback]);

  const handleSave = useCallback(() => {
    hapticFeedback();
    onSave(preferences);
  }, [hapticFeedback, onSave, preferences]);

  const resetToDefaults = useCallback(() => {
    hapticFeedback();
    setPreferences(getDefaultPreferences(userId));
  }, [hapticFeedback, userId]);

  const toggleGroupExpand = useCallback(
    (groupTitle: string) => {
      hapticFeedback();
      setExpandedGroup((prev) => (prev === groupTitle ? null : groupTitle));
    },
    [hapticFeedback]
  );

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const getPreference = (event: ProfileNotificationEvent): NotificationPreference => {
    return (
      preferences.preferences.find((p) => p.event === event) ||
      DEFAULT_NOTIFICATION_PREFERENCES.find((p) => p.event === event)!
    );
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + 16, paddingBottom: insets.bottom + 80 },
      ]}
      showsVerticalScrollIndicator={false}
      accessibilityRole="scrollbar"
    >
      <View style={styles.contentShell}>
        {/* Header */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(300)}
          style={styles.header}
        >
          <Text
            style={[styles.title, { color: colors.text }]}
            accessibilityRole="header"
          >
            Host Notification Preferences
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
            Choose how you want to be notified about your host profile activity.
          </Text>
        </Animated.View>

        {/* Event Groups */}
        {EVENT_GROUPS.map((group, groupIndex) => (
          <Animated.View
            key={group.title}
            entering={
              reducedMotion
                ? undefined
                : FadeInDown.duration(300).delay(100 * (groupIndex + 1))
            }
          >
            <GlassView contentStyle={styles.groupCard}>
              {/* Group Header */}
              <Pressable
                style={styles.groupHeader}
                onPress={() => toggleGroupExpand(group.title)}
                accessibilityRole="button"
                accessibilityLabel={`${group.title}: ${group.description}. ${expandedGroup === group.title ? 'Collapse' : 'Expand'}`}
                accessibilityState={{ expanded: expandedGroup === group.title }}
              >
                <View
                  style={[
                    styles.groupIcon,
                    { backgroundColor: group.color + '14' },
                  ]}
                >
                  <Ionicons
                    name={group.icon as any}
                    size={20}
                    color={group.color}
                  />
                </View>
                <View style={styles.groupInfo}>
                  <Text style={[styles.groupTitle, { color: colors.text }]}>
                    {group.title}
                  </Text>
                  <Text
                    style={[styles.groupDescription, { color: colors.textTertiary }]}
                    numberOfLines={1}
                  >
                    {group.description}
                  </Text>
                </View>
                <Ionicons
                  name={
                    expandedGroup === group.title
                      ? 'chevron-up'
                      : 'chevron-down'
                  }
                  size={18}
                  color={colors.textTertiary}
                />
              </Pressable>

              {/* Expanded Event Preferences */}
              {expandedGroup === group.title && (
                <View style={styles.eventList}>
                  {group.events.map((event, eventIndex) => {
                    const pref = getPreference(event);
                    return (
                      <View key={event}>
                        {eventIndex > 0 && (
                          <View
                            style={[
                              styles.eventDivider,
                              { backgroundColor: colors.borderLight },
                            ]}
                          />
                        )}
                        <View style={styles.eventRow}>
                          <View style={styles.eventInfo}>
                            <Text
                              style={[styles.eventLabel, { color: colors.text }]}
                            >
                              {getEventLabel(event)}
                            </Text>
                            <Text
                              style={[
                                styles.eventDescription,
                                { color: colors.textTertiary },
                              ]}
                              numberOfLines={2}
                            >
                              {getEventDescription(event)}
                            </Text>
                          </View>

                          {/* Channel Toggles */}
                          <View style={styles.channelToggles}>
                            <ChannelToggle
                              label="Email"
                              icon="mail"
                              enabled={pref.email}
                              onToggle={() => toggleChannel(event, 'email')}
                              color={colors}
                            />
                            <ChannelToggle
                              label="Push"
                              icon="phone-portrait"
                              enabled={pref.push}
                              onToggle={() => toggleChannel(event, 'push')}
                              color={colors}
                            />
                            <ChannelToggle
                              label="In-App"
                              icon="notifications"
                              enabled={pref.inApp}
                              onToggle={() => toggleChannel(event, 'inApp')}
                              color={colors}
                            />
                          </View>

                          {/* Digest Toggle */}
                          <View style={styles.digestRow}>
                            <Text
                              style={[
                                styles.digestLabel,
                                { color: colors.textTertiary },
                              ]}
                            >
                              Digest only
                            </Text>
                            <Switch
                              value={pref.digestOnly}
                              onValueChange={() => toggleDigestOnly(event)}
                              trackColor={{
                                false: colors.border,
                                true: CultureTokens.teal,
                              }}
                              thumbColor="#FFFFFF"
                              ios_backgroundColor={colors.border}
                              accessibilityLabel={`Batch ${getEventLabel(event)} into daily digest`}
                            />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </GlassView>
          </Animated.View>
        ))}

        {/* Digest Settings */}
        <Animated.View
          entering={
            reducedMotion
              ? undefined
              : FadeInDown.duration(300).delay(100 * (EVENT_GROUPS.length + 1))
          }
        >
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            DELIVERY SETTINGS
          </Text>
          <GlassView contentStyle={styles.settingsCard}>
            {/* Daily Digest */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: CultureTokens.indigo + '14' },
                  ]}
                >
                  <Ionicons
                    name="newspaper"
                    size={18}
                    color={CultureTokens.indigo}
                  />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Daily Digest
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.textTertiary },
                    ]}
                  >
                    Batch non-urgent notifications into a single daily email
                    {preferences.digestEnabled
                      ? ` at ${preferences.digestTime}`
                      : ''}
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.digestEnabled}
                onValueChange={toggleDigestEnabled}
                trackColor={{
                  false: colors.border,
                  true: CultureTokens.indigo,
                }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.border}
                accessibilityLabel="Enable daily digest email"
              />
            </View>

            <View
              style={[styles.settingDivider, { backgroundColor: colors.borderLight }]}
            />

            {/* Quiet Hours */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: CultureTokens.violet + '14' },
                  ]}
                >
                  <Ionicons
                    name="moon"
                    size={18}
                    color={CultureTokens.violet}
                  />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Quiet Hours
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {preferences.quietHoursEnabled
                      ? `No push notifications ${preferences.quietHoursStart} – ${preferences.quietHoursEnd}`
                      : 'Pause push notifications during set hours'}
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.quietHoursEnabled}
                onValueChange={toggleQuietHours}
                trackColor={{
                  false: colors.border,
                  true: CultureTokens.violet,
                }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.border}
                accessibilityLabel="Enable quiet hours for push notifications"
              />
            </View>
          </GlassView>
        </Animated.View>

        {/* Info Note */}
        <View style={styles.note}>
          <Ionicons
            name="information-circle"
            size={18}
            color={colors.textTertiary}
          />
          <Text style={[styles.noteText, { color: colors.textTertiary }]}>
            Critical security and account notifications are always delivered
            regardless of these preferences.
          </Text>
        </View>

        {/* Action Buttons */}
        <Animated.View
          entering={
            reducedMotion
              ? undefined
              : FadeInDown.duration(300).delay(100 * (EVENT_GROUPS.length + 2))
          }
          style={styles.actions}
        >
          <Pressable
            style={[
              styles.saveButton,
              { backgroundColor: CultureTokens.indigo, opacity: saving ? 0.7 : 1 },
            ]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Save notification preferences"
            accessibilityState={{ disabled: saving }}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.resetButton, { borderColor: colors.border }]}
            onPress={resetToDefaults}
            accessibilityRole="button"
            accessibilityLabel="Reset notification preferences to defaults"
          >
            <Text style={[styles.resetButtonText, { color: colors.textTertiary }]}>
              Reset to Defaults
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ChannelToggleProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  enabled: boolean;
  onToggle: () => void;
  color: ReturnType<typeof useColors>;
}

function ChannelToggle({ label, icon, enabled, onToggle, color }: ChannelToggleProps) {
  return (
    <Pressable
      style={[
        styles.channelChip,
        {
          backgroundColor: enabled
            ? CultureTokens.indigo + '14'
            : color.surfaceElevated + '80',
          borderColor: enabled ? CultureTokens.indigo + '40' : color.borderLight,
        },
      ]}
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityLabel={`${label} notifications`}
      accessibilityState={{ checked: enabled }}
    >
      <Ionicons
        name={icon as any}
        size={14}
        color={enabled ? CultureTokens.indigo : color.textTertiary}
      />
      <Text
        style={[
          styles.channelLabel,
          { color: enabled ? CultureTokens.indigo : color.textTertiary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  contentShell: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },

  // Group Card
  groupCard: {
    padding: 0,
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    minHeight: 44,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    marginBottom: 2,
  },
  groupDescription: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },

  // Event List
  eventList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  eventDivider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.5,
  },
  eventRow: {
    gap: 10,
  },
  eventInfo: {
    marginBottom: 8,
  },
  eventLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
  },

  // Channel Toggles
  channelToggles: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
  },
  channelLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },

  // Digest Row
  digestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  digestLabel: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },

  // Section Title
  sectionTitle: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.2,
    marginLeft: 4,
    marginBottom: 12,
    marginTop: 20,
  },

  // Settings Card
  settingsCard: {
    padding: 0,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
  },
  settingDivider: {
    height: 1,
    marginLeft: 64,
    opacity: 0.5,
  },

  // Note
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 4,
    marginTop: 16,
  },
  noteText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    flex: 1,
    lineHeight: 18,
  },

  // Actions
  actions: {
    marginTop: 24,
    gap: 12,
  },
  saveButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: '#FFFFFF',
  },
  resetButton: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
});

export default NotificationPreferences;
