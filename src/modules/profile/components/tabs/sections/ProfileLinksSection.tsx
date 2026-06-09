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
import { profileSectionLayout } from './profileSectionLayout';

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
              <Text style={[styles.rowLabel, { color: m3.onSurface }]} numberOfLines={1}>{item.label}</Text>
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
    { id: 'saved', icon: 'heart-outline' as const, label: 'Favorites & Stamps', path: '/saved', accent: CultureTokens.coral },
    { id: 'community', icon: 'people-outline' as const, label: 'My communities', path: '/communities', accent: CultureTokens.teal },
    { id: 'payment', icon: 'card-outline' as const, label: 'Payment methods', path: '/payment/methods', accent: m3.primary },
    { id: 'help', icon: 'help-circle-outline' as const, label: 'Help & support', path: '/help', accent: m3.tertiary },
  ];

  const attendeeRows: RowItem[] = PROFILE_ATTENDEE_TOOL_ROWS.map(r => ({ ...r, accent: r.accent ?? m3.primary }));
  const hostRows: RowItem[] = (isOrganizer ? PROFILE_HOST_ORGANIZER_ROWS : PROFILE_HOST_ASPIRING_ROWS).map(r => ({ ...r, accent: r.accent ?? CultureTokens.teal }));

  return (
    <>
      <View style={[profileSectionLayout.section, { paddingHorizontal: hPad }]}>
        <M3SectionHeader title="Quick links" />
        <M3ListCard rows={quickLinks} onPress={nav} />
      </View>

      <View style={[profileSectionLayout.section, { paddingHorizontal: hPad }]}>
        <M3SectionHeader
          title="Attendee tools"
          actionLabel="My calendar"
          onAction={() => nav('/(tabs)/calendar')}
        />
        <Text style={[styles.sectionIntro, { color: m3.onSurfaceVariant }]} numberOfLines={2}>
          Tickets, member perks, and calendar sync in one place.
        </Text>
        <M3ListCard rows={attendeeRows} onPress={nav} />
      </View>

      <View style={[profileSectionLayout.section, { paddingHorizontal: hPad }]}>
        <Pressable
          onPress={() => nav('/hostspace')}
          style={({ pressed }) => [
            styles.hostStudioBanner,
            { backgroundColor: m3.primaryContainer, opacity: pressed ? 0.9 : 1 }
          ]}
          accessibilityRole="button"
          accessibilityLabel={isOrganizer ? "Enter Host Studio" : "Enter Host Studio (Sandbox)"}
        >
          <View style={styles.hostStudioContent}>
            <View style={styles.hostStudioIcon}>
              <Ionicons name="briefcase-outline" size={22} color={m3.onPrimaryContainer} />
            </View>
            <View style={profileSectionLayout.flex1}>
              <Text style={[styles.hostStudioTitle, { color: m3.onPrimaryContainer }]} numberOfLines={1}>
                {isOrganizer ? 'Host Studio' : 'Host Studio (Sandbox)'}
              </Text>
              <Text style={[styles.hostStudioSub, { color: m3.onPrimaryContainer }]} numberOfLines={2}>
                {isOrganizer
                  ? 'Create, manage events & scan tickets'
                  : 'Draft profiles & events, apply to publish'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={m3.onPrimaryContainer} />
          </View>
        </Pressable>
      </View>

      <View style={[profileSectionLayout.section, { paddingHorizontal: hPad }]}>
        <M3SectionHeader
          title="Host Hub"
          actionLabel={isOrganizer ? 'Host Dashboard' : undefined}
          onAction={isOrganizer ? () => nav('/hostspace/dashboard') : undefined}
        />
        <Text style={[styles.sectionIntro, { color: m3.onSurfaceVariant }]} numberOfLines={3}>
          {isOrganizer
            ? 'Your command center for events, communities, ticket scanning, and growth.'
            : 'Apply to host events, build communities, and reach thousands of cultural seekers.'}
        </Text>
        <M3ListCard rows={hostRows} onPress={nav} />
      </View>
    </>
  );
});

ProfileLinksSection.displayName = 'ProfileLinksSection';

const styles = StyleSheet.create({
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
  hostStudioBanner: {
    borderRadius: MaterialExpressive.shape.cornerExtraLarge,
    padding: 18,
    marginTop: 8,
  },
  hostStudioContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  hostStudioIcon: {
    width: 44,
    height: 44,
    borderRadius: MaterialExpressive.shape.cornerLarge,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostStudioTitle: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
  hostStudioSub: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 2,
    opacity: 0.85,
  },
});