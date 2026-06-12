import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  HOSTSPACE_CREATE_CATALOG_PATHNAME,
  HOSTSPACE_PATHNAME,
} from '@/constants/navigation/createNav';
import { useColors } from '@/hooks/useColors';
import { FontFamily, Radius } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { withAlpha } from '@/lib/withAlpha';

export type HostspaceHubPanel = 'manage' | 'create';

const DASHBOARD_HREF = '/hostspace/dashboard';

type HubItem = {
  id: HostspaceHubPanel;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  color: string;
};

const HUB_ITEMS: HubItem[] = [
  {
    id: 'manage',
    label: 'Manage',
    icon: 'grid-outline',
    href: HOSTSPACE_PATHNAME,
    color: Luxe.colors.indigo,
  },
  {
    id: 'create',
    label: 'Create Lab',
    icon: 'add-circle-outline',
    href: HOSTSPACE_CREATE_CATALOG_PATHNAME,
    color: Luxe.colors.appBlue,
  },
];

interface HostspaceHubNavProps {
  activePanel: HostspaceHubPanel;
  hPad: number;
}

export function HostspaceHubNav({ activePanel, hPad }: HostspaceHubNavProps) {
  const colors = useColors();

  return (
    <View style={[s.row, { paddingHorizontal: hPad }]}>
      {HUB_ITEMS.map((item) => {
        const selected = item.id === activePanel;

        return (
          <View key={item.id} style={item.id === 'create' ? s.createGroup : undefined}>
            <Pressable
              onPress={() => router.push(item.href as never)}
              style={({ pressed }) => [
                s.chip,
                {
                  backgroundColor: selected
                    ? withAlpha(item.color, 0.14)
                    : withAlpha(colors.text, 0.04),
                  borderColor: selected ? withAlpha(item.color, 0.35) : colors.borderLight,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={item.label}
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={selected ? item.color : colors.textSecondary}
              />
              <Text
                style={[
                  s.label,
                  {
                    color: selected ? item.color : colors.text,
                    fontFamily: selected ? FontFamily.bold : FontFamily.semibold,
                  },
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
            {item.id === 'create' ? (
              <Pressable
                onPress={() => router.push(DASHBOARD_HREF as never)}
                style={({ pressed }) => [
                  s.analyticsBtn,
                  {
                    backgroundColor: withAlpha(Luxe.colors.emerald, 0.1),
                    borderColor: withAlpha(Luxe.colors.emerald, 0.28),
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="View your creator analytics"
              >
                <Ionicons name="analytics-outline" size={14} color={Luxe.colors.emerald} />
                <Text style={[s.analyticsLabel, { color: Luxe.colors.emerald }]} numberOfLines={1}>
                  View your creator analytics
                </Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
    paddingBottom: 10,
  },
  createGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  analyticsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 13,
  },
  analyticsLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
  },
});