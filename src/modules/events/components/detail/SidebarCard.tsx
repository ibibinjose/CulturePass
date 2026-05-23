import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ColorTheme } from '@/design-system/tokens/colors';
import { M3Button } from '@/design-system/ui/M3Button';
import { M3Card } from '@/design-system/ui/M3Card';
import { FontFamily, M3Typography } from '@/design-system/tokens/theme';
import { useM3Colors } from '@/hooks/useM3Colors';
import type { EventData } from '@/shared/schema';

interface SidebarCardProps {
  event: EventData;
  organizer: unknown;
  eventTags: string[];
  goingCount: number;
  handleEmailHost: () => void;
  handleCallHost: () => void;
  handleVisitWebsite: () => void;
  colors: ColorTheme;
  title?: string;
  children?: React.ReactNode;
}

export function SidebarCard({
  event,
  eventTags,
  goingCount,
  handleEmailHost,
  handleVisitWebsite,
}: SidebarCardProps) {
  const m3Colors = useM3Colors();
  return (
    <M3Card variant="filled" style={sc.card}>
      <Text style={[sc.title, M3Typography.titleMedium, { color: m3Colors.onSurface }]}>{event.organizerId ?? 'Organizer'}</Text>

      {goingCount > 0 ? (
        <View style={sc.stat}>
          <Ionicons name="people" size={16} color={m3Colors.primary} />
          <Text style={[sc.statText, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>{goingCount} attending</Text>
        </View>
      ) : null}

      {eventTags.length > 0 ? (
        <View style={sc.tags}>
          {eventTags.slice(0, 5).map((tag) => (
            <View key={tag} style={[sc.tag, { backgroundColor: m3Colors.secondaryContainer }]}>
              <Text style={[sc.tagText, { color: m3Colors.onSecondaryContainer }]}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={sc.actions}>
        <M3Button variant="tonal" leftIcon="mail-outline" onPress={handleEmailHost} fullWidth>
          Contact
        </M3Button>
        <M3Button variant="tonal" leftIcon="globe-outline" onPress={handleVisitWebsite} fullWidth>
          Website
        </M3Button>
      </View>
    </M3Card>
  );
}

const sc = StyleSheet.create({
  card: {
    padding: 20,
    marginBottom: 16,
    gap: 16,
  },
  title: {},
  stat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statText: {},
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: 11, fontFamily: FontFamily.bold },
  actions: { gap: 12, marginTop: 4 },
});
