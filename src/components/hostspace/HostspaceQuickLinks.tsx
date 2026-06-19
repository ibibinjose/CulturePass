import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { FontFamily, Radius } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { LuxeText } from '@/design-system/ui';
import { withAlpha } from '@/lib/withAlpha';
import {
  EVENT_WIZARD_PATHNAME,
  HOSTSPACE_CREATE_CATALOG_PATHNAME,
  HOSTSPACE_CREATE_PAGE_PATHNAME,
  CULTURE_MARKET_LISTING_LAB_PATHNAME,
} from '@/constants/navigation/createNav';
import { buildHostspaceManageHref } from '@/lib/hostspaceDeeplinks';

type QuickLink = {
  key: string;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  href: string;
};

const QUICK_LINKS: QuickLink[] = [
  {
    key: 'event',
    label: 'New event',
    subtitle: 'Tickets & RSVPs',
    icon: 'calendar-outline',
    color: Luxe.colors.appBlue,
    href: EVENT_WIZARD_PATHNAME,
  },
  {
    key: 'page',
    label: 'Orgs & Communities',
    subtitle: '9 types · one dropdown form',
    icon: 'people-outline',
    color: Luxe.colors.plum,
    href: HOSTSPACE_CREATE_PAGE_PATHNAME,
  },
  {
    key: 'market',
    label: 'CultureMarket',
    subtitle: 'Products & services',
    icon: 'storefront-outline',
    color: Luxe.colors.emerald,
    href: CULTURE_MARKET_LISTING_LAB_PATHNAME,
  },
  {
    key: 'create',
    label: 'Creation Lab',
    subtitle: 'All 36 create types',
    icon: 'add-circle-outline',
    color: Luxe.colors.gold,
    href: HOSTSPACE_CREATE_CATALOG_PATHNAME,
  },
  {
    key: 'events-tab',
    label: 'My events',
    subtitle: 'Manage published',
    icon: 'radio-outline',
    color: Luxe.colors.indigo,
    href: buildHostspaceManageHref('events'),
  },
  {
    key: 'scanner',
    label: 'Scan tickets',
    subtitle: 'Door check-in',
    icon: 'scan-outline',
    color: Luxe.colors.indigo,
    href: '/scanner',
  },
];

interface HostspaceQuickLinksProps {
  hPad?: number;
}

export function HostspaceQuickLinks({ hPad }: HostspaceQuickLinksProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();

  return (
    <View style={s.section}>
      <LuxeText variant="title3" style={{ color: colors.text }}>
        Quick links
      </LuxeText>
      <View style={s.grid}>
        {QUICK_LINKS.map((link) => (
          <Pressable
            key={link.key}
            onPress={() => router.push(link.href as never)}
            style={({ pressed }) => [
              isDesktop ? s.cardDesktop : s.card,
              {
                backgroundColor: withAlpha(link.color, 0.06),
                borderColor: withAlpha(link.color, 0.2),
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            accessibilityRole="link"
            accessibilityLabel={link.label}
          >
            <View style={[s.iconWrap, { backgroundColor: withAlpha(link.color, 0.14) }]}>
              <Ionicons name={link.icon} size={18} color={link.color} />
            </View>
            <View style={s.copy}>
              <Text style={[s.title, { color: colors.text }]} numberOfLines={1}>
                {link.label}
              </Text>
              <Text style={[s.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {link.subtitle}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: { gap: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardDesktop: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2, minWidth: 0 },
  title: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
});