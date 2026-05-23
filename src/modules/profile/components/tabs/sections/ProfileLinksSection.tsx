import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { FontFamily, MaterialExpressive, CultureTokens } from '@/design-system/tokens/theme';
import { M3SectionHeader } from '@/design-system/ui';
import {
  PROFILE_ATTENDEE_TOOL_ROWS,
  PROFILE_HOST_ASPIRING_ROWS,
  PROFILE_HOST_ORGANIZER_ROWS,
} from '@/constants/navigation/experienceNav';

type RowItem = {
  id?: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  path: string;
  accent: string;
};

function M3ListCard({
  rows,
  onPress,
}: {
  rows: RowItem[];
  onPress: (path: string) => void;
}) {
  const m3 = useM3Colors();
  return (
    <View style={[styles.shell, { backgroundColor: m3.surfaceContainerLow, borderColor: m3.outlineVariant }]}>
      {rows.map((item, i) => (
        <React.Fragment key={item.id ?? item.path}>
          <Pressable
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: m3.surfaceContainerHigh }]}
            onPress={() => onPress(item.path)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <View style={[styles.iconWell, { backgroundColor: item.accent + '18' }]}>
              <Ionicons name={item.icon} size={20} color={item.accent} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: m3.onSurface }]}>{item.label}</Text>
              {item.sub ? (
                <Text style={[styles.rowSub, { color: m3.onSurfaceVariant }]} numberOfLines={2}>{item.sub}</Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={16} color={m3.onSurfaceVariant} />
          </Pressable>
          {i < rows.length - 1 ? (
            <View style={[styles.divider, { backgroundColor: m3.outlineVariant }]} />
          ) : null}
        </React.Fragment>
      ))}
    </View>
  );
}

interface ProfileLinksSectionProps {
  isAdmin: boolean;
  isOrganizer: boolean;
  nav: (path: string) => void;
}

export const ProfileLinksSection = React.memo(({
  isAdmin,
  isOrganizer,
  nav,
}: ProfileLinksSectionProps) => {
  const m3 = useM3Colors();
  const { hPad } = useLayout();

  const quickLinks: RowItem[] = [
    ...(isAdmin ? [{ id: 'admin', icon: 'shield-checkmark-outline' as const, label: 'Admin Console', path: '/admin', accent: m3.error }] : []),
    { id: 'network', icon: 'git-network-outline' as const, label: 'My Circle', path: '/network?tab=followers', accent: m3.primary },
    { id: 'saved', icon: 'bookmark-outline' as const, label: 'Saved events', path: '/saved', accent: CultureTokens.violet },
    { id: 'community', icon: 'people-outline' as const, label: 'My communities', path: '/communities', accent: CultureTokens.teal },
    { id: 'perksLink', icon: 'gift-outline' as const, label: 'Perks & rewards', path: '/perks', accent: CultureTokens.gold },
    { id: 'payment', icon: 'card-outline' as const, label: 'Payment methods', path: '/payment/methods', accent: m3.primary },
    { id: 'help', icon: 'help-circle-outline' as const, label: 'Help & support', path: '/help', accent: m3.tertiary },
  ];

  const attendeeRows: RowItem[] = PROFILE_ATTENDEE_TOOL_ROWS.map(r => ({ ...r, accent: r.accent ?? m3.primary }));
  const hostRows: RowItem[] = (isOrganizer ? PROFILE_HOST_ORGANIZER_ROWS : PROFILE_HOST_ASPIRING_ROWS).map(r => ({ ...r, accent: r.accent ?? CultureTokens.teal }));

  return (
    <>
      <View style={[styles.section, { paddingHorizontal: hPad }]}>
        <M3SectionHeader title="Quick links" />
        <M3ListCard rows={quickLinks} onPress={nav} />
      </View>

      <View style={[styles.section, { paddingHorizontal: hPad }]}>
        <M3SectionHeader
          title="Attendee tools"
          actionLabel="My calendar"
          onAction={() => nav('/(tabs)/calendar')}
        />
        <Text style={[styles.sectionIntro, { color: m3.onSurfaceVariant }]}>
          Tickets, saves, and reminders in one place.
        </Text>
        <M3ListCard rows={attendeeRows} onPress={nav} />
      </View>

      <View style={[styles.section, { paddingHorizontal: hPad }]}>
        <M3SectionHeader
          title="Host Hub"
          actionLabel={isOrganizer ? 'Dashboard' : undefined}
          onAction={isOrganizer ? () => nav('/dashboard/organizer') : undefined}
        />
        <Text style={[styles.sectionIntro, { color: m3.onSurfaceVariant }]}>
          {isOrganizer
            ? 'Manage listings, payouts, and check-in from your organizer workspace.'
            : 'List a cultural experience, sell tickets, and grow your audience.'}
        </Text>
        <M3ListCard rows={hostRows} onPress={nav} />
      </View>
    </>
  );
});

ProfileLinksSection.displayName = 'ProfileLinksSection';

const styles = StyleSheet.create({
  section: { marginTop: 36 },
  sectionIntro: { fontSize: 13, fontFamily: FontFamily.regular, lineHeight: 20, marginBottom: 10, marginTop: -4 },
  shell: {
    borderRadius: MaterialExpressive.shape.cornerExtraLarge,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    minHeight: 56,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: MaterialExpressive.shape.cornerLarge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.1,
  },
  rowSub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 17,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 70,
    marginRight: 16,
  },
});
