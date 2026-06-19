import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { Section } from '@/components/forms';
import { navigateToCreateById } from '@/lib/creationRouting';
import { getOrgHostListingCategories } from '@/modules/host/config/hostspaceCreateCategories.config';
import { FontFamily, Radius } from '@/design-system/tokens/theme';
import { withAlpha } from '@/lib/withAlpha';

interface OrgHostListingCreateSectionProps {
  hostPageId: string;
  source: string;
  compact?: boolean;
}

export function OrgHostListingCreateSection({
  hostPageId,
  source,
  compact = false,
}: OrgHostListingCreateSectionProps) {
  const colors = useColors();
  const listings = getOrgHostListingCategories();

  return (
    <Section
      title="Create listing under your org"
      icon="layers-outline"
    >
      <Text style={[s.hint, { color: colors.textSecondary }]}>
        Publish events, activities, offers, and directory listings under this org or community page.
      </Text>
      <View style={s.grid}>
        {listings.map((item) => (
          <Pressable
            key={item.id}
            onPress={() =>
              navigateToCreateById(item.id, {
                source,
                parentHostPageId: hostPageId,
              })
            }
            style={({ pressed }) => [
              compact ? s.chip : s.card,
              {
                backgroundColor: withAlpha(item.color, 0.08),
                borderColor: withAlpha(item.color, 0.22),
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Create ${item.label} under your org page`}
          >
            <Ionicons name={item.icon} size={compact ? 16 : 18} color={item.color} />
            <Text style={[s.label, { color: colors.text }]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Section>
  );
}

const s = StyleSheet.create({
  hint: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    lineHeight: 18,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: '47%',
    flexGrow: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    flexShrink: 1,
  },
});