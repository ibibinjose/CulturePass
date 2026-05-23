import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  TextInput,
  Linking,
  KeyboardAvoidingView,
} from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import {
  CultureTokens,
  gradients,
  TextStyles,
} from '@/design-system/tokens/theme';
import {
  APP_NAME,
  EMAIL_BUGS,
  EMAIL_LEGAL,
  EMAIL_PRIVACY,
  EMAIL_SUPPORT,
  getAppVersionWithBuild,
} from '@/lib/app-meta';
import { goBackOrReplace } from '@/lib/navigation';
import { modulesApi } from '@/modules/api';
import { getApiErrorMessage } from '@/lib/format';
import { M3TopAppBar } from '@/design-system/ui';

const PHONE_DISPLAY = '1800 285 887';
const PHONE_URI = 'tel:1800285887';
const EMAIL_PRESS = 'media@culturepass.app';
const EMAIL_PARTNERSHIPS = 'partnerships@culturepass.app';
const EMAIL_ORGANISERS = 'organisers@culturepass.app';

const OFFICE_LINES = [
  'CulturePass Pty Ltd',
  'Level 2, 100 Harris Street',
  'Pyrmont NSW 2009',
  'Australia',
] as const;

const BUSINESS_HOURS = [
  { days: 'Monday – Friday', hours: '9:00 am – 6:00 pm AEST' },
  { days: 'Saturday', hours: '10:00 am – 2:00 pm AEST' },
  { days: 'Sunday & Public Holidays', hours: 'Closed (email monitored)' },
] as const;

type ChannelId = 'support' | 'legal' | 'privacy' | 'bugs';

const CHANNELS: {
  id: ChannelId;
  title: string;
  description: string;
  email: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  sla: string;
}[] = [
  {
    id: 'support',
    title: 'Help & account',
    description: 'Billing, tickets, login issues, refund requests, and general questions about using CulturePass.',
    email: EMAIL_SUPPORT,
    icon: 'chatbubbles-outline',
    accent: CultureTokens.indigo,
    sla: 'Typically 1 business day',
  },
  {
    id: 'legal',
    title: 'Legal',
    description: 'Terms of service questions, takedown notices, commercial agreements, licensing, and compliance matters.',
    email: EMAIL_LEGAL,
    icon: 'briefcase-outline',
    accent: CultureTokens.gold,
    sla: 'Typically 3 business days',
  },
  {
    id: 'privacy',
    title: 'Privacy & data',
    description: 'Access requests, correction requests, erasure (right to be forgotten), data portability, and privacy complaints.',
    email: EMAIL_PRIVACY,
    icon: 'shield-checkmark-outline',
    accent: CultureTokens.teal,
    sla: 'Within 30 days (as required by law)',
  },
  {
    id: 'bugs',
    title: 'Bugs & security',
    description: 'Crash reports, broken features, broken payment flows, and responsible disclosure of security vulnerabilities.',
    email: EMAIL_BUGS,
    icon: 'construct-outline',
    accent: CultureTokens.coral,
    sla: 'Critical issues: same business day',
  },
];

const ADDITIONAL_CONTACTS: {
  title: string;
  description: string;
  email: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
}[] = [
  {
    title: 'Media & press',
    description: 'Press enquiries, interview requests, media kit, and spokesperson availability.',
    email: EMAIL_PRESS,
    icon: 'newspaper-outline',
    accent: CultureTokens.violet,
  },
  {
    title: 'Partnerships',
    description: 'Brand partnerships, sponsorship opportunities, API integration, and community organisation collaborations.',
    email: EMAIL_PARTNERSHIPS,
    icon: 'people-circle-outline',
    accent: CultureTokens.indigo,
  },
  {
    title: 'Organiser onboarding',
    description: 'Questions about listing events, ticketing setup, Stripe Connect onboarding, and organiser accounts.',
    email: EMAIL_ORGANISERS,
    icon: 'calendar-outline',
    accent: CultureTokens.teal,
  },
];

function buildMailto(to: string, subject: string, body: string): string {
  const parts: string[] = [];
  if (subject.trim()) parts.push(`subject=${encodeURIComponent(subject.trim())}`);
  if (body.trim()) parts.push(`body=${encodeURIComponent(body.trim())}`);
  const q = parts.length ? `?${parts.join('&')}` : '';
  return `mailto:${to}${q}`;
}

export default function ContactScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [channel, setChannel] = useState<ChannelId>('support');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attemptedSend, setAttemptedSend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessId, setSubmitSuccessId] = useState<string | null>(null);

  const active = CHANNELS.find((c) => c.id === channel)!;

  const defaultSubject = useMemo(
    () => `[${APP_NAME}] ${active.title}`,
    [active.title],
  );

  const subjectEffective = subject.trim() || defaultSubject;

  const messageOk = message.trim().length >= 16;

  const submitTicket = useCallback(async () => {
    setAttemptedSend(true);
    setSubmitError(null);
    setSubmitSuccessId(null);
    if (!messageOk) {
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    const ver = getAppVersionWithBuild();
    setIsSubmitting(true);
    try {
      const res = await modulesApi.support.createTicket({
        department: channel,
        toEmail: active.email,
        subject: subjectEffective,
        message: message.trim(),
        appVersion: ver,
        platform: Platform.OS,
      });
      setSubmitSuccessId(res.ticket.id);
      setSubject('');
      setMessage('');
      setAttemptedSend(false);
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Unable to submit your ticket right now. Please try again, or use the email app option below.'));
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  }, [active.email, channel, message, messageOk, subjectEffective]);

  const openEmailDirect = useCallback(
    async (email: string) => {
      const uri = `mailto:${email}`;
      if (Platform.OS !== 'web') void Haptics.selectionAsync();
      await Linking.openURL(uri);
    },
    [],
  );

  const callSupport = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    void Linking.openURL(PHONE_URI);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <LinearGradient
            colors={gradients.culturepassBrand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { paddingTop: topInset + 16 }]}
          >
            <M3TopAppBar title="Contact" onBack={() => goBackOrReplace('/menu')} denseWeb webChromeless />

            <View style={styles.heroInner}>
              <View style={styles.heroBadge}>
                <Ionicons name="mail-unread-outline" size={16} color={CultureTokens.gold} />
                <Text style={styles.heroBadgeText}>Contact {APP_NAME}</Text>
              </View>
              <Text style={styles.heroTitle}>We&apos;re here to help</Text>
              <Text style={styles.heroSubtitle}>
                Select the right inbox for the fastest response. Every submission creates a tracked ticket
                — so nothing gets lost, and you&apos;ll always receive a reference number.
              </Text>
              <View style={styles.heroMetaRow}>
                <View style={styles.heroMetaPill}>
                  <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.heroMetaText}>Support: within 1 business day</Text>
                </View>
                <View style={styles.heroMetaPill}>
                  <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.heroMetaText}>Sydney, Australia (AEST)</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.body}>
            {/* Fast paths */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Quick contact</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Pressable
                onPress={() => openEmailDirect(EMAIL_SUPPORT)}
                style={({ pressed }) => [styles.rowPress, pressed && { backgroundColor: colors.backgroundSecondary }]}
                accessibilityRole="button"
                accessibilityLabel={`Email ${EMAIL_SUPPORT}`}
              >
                <View style={[styles.rowIcon, { backgroundColor: CultureTokens.indigo + '18' }]}>
                  <Ionicons name="mail-outline" size={22} color={CultureTokens.indigo} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Email support</Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{EMAIL_SUPPORT}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>
              <View style={[styles.hairline, { backgroundColor: colors.divider }]} />
              <Pressable
                onPress={callSupport}
                style={({ pressed }) => [styles.rowPress, pressed && { backgroundColor: colors.backgroundSecondary }]}
                accessibilityRole="button"
                accessibilityLabel={`Call ${PHONE_DISPLAY}`}
              >
                <View style={[styles.rowIcon, { backgroundColor: CultureTokens.teal + '18' }]}>
                  <Ionicons name="call-outline" size={22} color={CultureTokens.teal} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Phone (freecall AU)</Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{PHONE_DISPLAY} · Mon–Fri 9am–6pm AEST</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>
            </View>

            {/* Department selector */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 28 }]}>Select department</Text>
            <View style={styles.chipWrap}>
              {CHANNELS.map((c) => {
                const on = c.id === channel;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      if (Platform.OS !== 'web') void Haptics.selectionAsync();
                      setChannel(c.id);
                      setAttemptedSend(false);
                      setSubmitError(null);
                      setSubmitSuccessId(null);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: on ? c.accent + '22' : colors.surfaceElevated,
                        borderColor: on ? c.accent : colors.borderLight,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Ionicons name={c.icon} size={16} color={on ? c.accent : colors.textSecondary} />
                    <Text style={[styles.chipLabel, { color: on ? c.accent : colors.text }]}>{c.title}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.channelInfo, { backgroundColor: active.accent + '0D', borderColor: active.accent + '25' }]}>
              <Text style={[styles.channelDesc, { color: colors.textSecondary }]}>{active.description}</Text>
              <Text style={[styles.channelSla, { color: active.accent }]}>
                <Ionicons name="alarm-outline" size={12} /> {active.sla}
              </Text>
            </View>

            {/* Message form */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 24 }]}>Write to us</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>To</Text>
              <Text style={[styles.staticEmail, { color: colors.text }]}>{active.email}</Text>

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>Subject (optional)</Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder={defaultSubject}
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.input,
                  { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.backgroundSecondary },
                ]}
                accessibilityLabel="Email subject"
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                Message <Text style={{ color: colors.textTertiary }}>(required — min. 16 chars)</Text>
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Please describe your question or issue in as much detail as possible. Include any relevant order or ticket reference numbers."
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
                style={[
                  styles.inputArea,
                  { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.backgroundSecondary },
                ]}
                accessibilityLabel="Message body"
              />

              {attemptedSend && !messageOk ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  Please provide a little more detail (at least 16 characters) so our team can help you effectively.
                </Text>
              ) : null}
              {submitError ? (
                <Text style={[styles.errorText, { color: colors.error }]}>{submitError}</Text>
              ) : null}
              {submitSuccessId ? (
                <View style={[styles.successBox, { backgroundColor: CultureTokens.success + '12', borderColor: CultureTokens.success + '30' }]}>
                  <Ionicons name="checkmark-circle" size={20} color={CultureTokens.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.successTitle, { color: CultureTokens.success }]}>Ticket submitted successfully</Text>
                    <Text style={[styles.successSub, { color: colors.textSecondary }]}>
                      Reference: {submitSuccessId}{'\n'}We&apos;ll respond to {active.email} within {active.sla.toLowerCase()}.
                    </Text>
                  </View>
                </View>
              ) : null}

              <Pressable
                onPress={submitTicket}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: active.accent, opacity: pressed ? 0.9 : 1 },
                  isSubmitting && { opacity: 0.7 },
                ]}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Submit support ticket"
              >
                <Ionicons name={isSubmitting ? 'time-outline' : 'send-outline'} size={20} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>
                  {isSubmitting ? 'Submitting…' : 'Submit ticket'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const ver = getAppVersionWithBuild();
                  const footer = `\n\n—\nApp: ${APP_NAME} ${ver}\nPlatform: ${Platform.OS}`;
                  const uri = buildMailto(active.email, subjectEffective, `${message.trim()}${footer}`);
                  void Linking.openURL(uri);
                }}
                style={({ pressed }) => [styles.secondaryBtn, { borderColor: colors.borderLight, opacity: pressed ? 0.9 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Open email app instead"
              >
                <Ionicons name="mail-open-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Open in email app instead</Text>
              </Pressable>
            </View>

            {/* Other departments */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 28 }]}>Other enquiries</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              {ADDITIONAL_CONTACTS.map((ac, i) => (
                <React.Fragment key={ac.email}>
                  {i > 0 && <View style={[styles.hairline, { backgroundColor: colors.divider }]} />}
                  <Pressable
                    onPress={() => openEmailDirect(ac.email)}
                    style={({ pressed }) => [styles.rowPress, pressed && { backgroundColor: colors.backgroundSecondary }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Email ${ac.email}`}
                  >
                    <View style={[styles.rowIcon, { backgroundColor: ac.accent + '18' }]}>
                      <Ionicons name={ac.icon} size={22} color={ac.accent} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>{ac.title}</Text>
                      <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={2}>{ac.description}</Text>
                      <Text style={[styles.rowEmail, { color: ac.accent }]}>{ac.email}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                  </Pressable>
                </React.Fragment>
              ))}
            </View>

            {/* Business hours */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 28 }]}>Business hours</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              {BUSINESS_HOURS.map((bh, i) => (
                <React.Fragment key={bh.days}>
                  {i > 0 && <View style={[styles.hairlineThin, { backgroundColor: colors.divider }]} />}
                  <View style={styles.hoursRow}>
                    <Text style={[styles.hoursDay, { color: colors.text }]}>{bh.days}</Text>
                    <Text style={[styles.hoursTime, { color: colors.textSecondary }]}>{bh.hours}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>

            {/* Office */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 28 }]}>Registered office</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              {OFFICE_LINES.map((line) => (
                <Text key={line} style={[styles.officeLine, { color: colors.text }]}>{line}</Text>
              ))}
              <View style={[styles.hairlineThin, { backgroundColor: colors.divider, marginVertical: 12 }]} />
              <Text style={[styles.officeNote, { color: colors.textSecondary }]}>
                Postal correspondence is accepted. Please allow 7–10 business days for a response to postal enquiries.
                For urgent matters, email is strongly preferred.
              </Text>
            </View>

            {/* Resources */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 28 }]}>Helpful resources</Text>
            <View style={styles.resourceRow}>
              <Link href="/help" asChild>
                <Pressable
                  style={StyleSheet.flatten([
                    styles.resourceChip,
                    { borderColor: colors.borderLight, backgroundColor: colors.surface },
                  ])}
                >
                  <Ionicons name="help-buoy-outline" size={18} color={CultureTokens.indigo} />
                  <Text style={[styles.resourceChipText, { color: colors.text }]}>Help centre</Text>
                </Pressable>
              </Link>
              <Link href="/legal/terms" asChild>
                <Pressable
                  style={StyleSheet.flatten([
                    styles.resourceChip,
                    { borderColor: colors.borderLight, backgroundColor: colors.surface },
                  ])}
                >
                  <Ionicons name="document-text-outline" size={18} color={CultureTokens.gold} />
                  <Text style={[styles.resourceChipText, { color: colors.text }]}>Terms of service</Text>
                </Pressable>
              </Link>
              <Link href="/legal/privacy" asChild>
                <Pressable
                  style={StyleSheet.flatten([
                    styles.resourceChip,
                    { borderColor: colors.borderLight, backgroundColor: colors.surface },
                  ])}
                >
                  <Ionicons name="shield-checkmark-outline" size={18} color={CultureTokens.teal} />
                  <Text style={[styles.resourceChipText, { color: colors.text }]}>Privacy policy</Text>
                </Pressable>
              </Link>
              <Link href="/legal/community" asChild>
                <Pressable
                  style={StyleSheet.flatten([
                    styles.resourceChip,
                    { borderColor: colors.borderLight, backgroundColor: colors.surface },
                  ])}
                >
                  <Ionicons name="people-outline" size={18} color={CultureTokens.coral} />
                  <Text style={[styles.resourceChipText, { color: colors.text }]}>Community guidelines</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: { flex: 1 },
    flex: { flex: 1 },
    hero: {
      paddingBottom: 36,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      overflow: 'hidden',
    },
    heroInner: {
      paddingHorizontal: 24,
      paddingTop: 8,
      maxWidth: 720,
      alignSelf: 'center',
      width: '100%',
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 9999,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
      marginBottom: 16,
    },
    heroBadgeText: {
      ...TextStyles.label,
      color: '#FFFFFF',
      fontSize: 12,
      fontFamily: 'Poppins_600SemiBold',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 34,
      lineHeight: 40,
      color: '#FFFFFF',
      marginBottom: 12,
      letterSpacing: -0.4,
    },
    heroSubtitle: {
      ...TextStyles.body,
      fontSize: 16,
      lineHeight: 24,
      color: 'rgba(255,255,255,0.94)',
      marginBottom: 16,
    },
    heroMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    heroMetaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 9999,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    heroMetaText: {
      fontSize: 12,
      fontFamily: 'Poppins_500Medium',
      color: 'rgba(255,255,255,0.9)',
    },
    body: {
      paddingHorizontal: 20,
      paddingTop: 28,
      maxWidth: 720,
      alignSelf: 'center',
      width: '100%',
    },
    sectionLabel: {
      fontSize: 12,
      fontFamily: 'Poppins_600SemiBold',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    card: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 16,
    },
    rowPress: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderRadius: 12,
    },
    rowIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    rowText: { flex: 1, minWidth: 0 },
    rowTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
    rowSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 2, lineHeight: 18 },
    rowEmail: { fontSize: 12, fontFamily: 'Poppins_500Medium', marginTop: 3 },
    hairline: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
    hairlineThin: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 9999,
      borderWidth: 1,
    },
    chipLabel: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
    channelInfo: {
      marginTop: 10,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      gap: 6,
    },
    channelDesc: { fontSize: 14, lineHeight: 21, fontFamily: 'Poppins_400Regular' },
    channelSla: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
    inputLabel: { fontSize: 12, fontFamily: 'Poppins_500Medium', marginBottom: 6 },
    staticEmail: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: 'Poppins_400Regular',
    },
    inputArea: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 120,
      fontSize: 15,
      fontFamily: 'Poppins_400Regular',
    },
    errorText: { marginTop: 10, fontSize: 13, fontFamily: 'Poppins_500Medium', lineHeight: 19 },
    successBox: {
      marginTop: 14,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    successTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 3 },
    successSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 19 },
    primaryBtn: {
      marginTop: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 15,
      borderRadius: 14,
    },
    primaryBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Poppins_600SemiBold',
    },
    secondaryBtn: {
      marginTop: 10,
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    secondaryBtnText: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
    hoursRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    hoursDay: { fontSize: 14, fontFamily: 'Poppins_500Medium', flex: 1 },
    hoursTime: { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'right' },
    officeLine: { fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 24 },
    officeNote: { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 20 },
    resourceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    resourceChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      ...Platform.select({
        web: { cursor: 'pointer' } as const,
        default: {},
      }),
    },
    resourceChipText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  });
}
