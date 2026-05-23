import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { M3SectionHeader } from '@/design-system/ui/M3SectionHeader';
import { TextStyles } from '@/design-system/tokens/theme';
import { useCultureExplorerQuests } from '@/hooks/queries/useCultureExplorer';
import { QuestCard } from './QuestCard';

interface Props {
  city?: string;
  country?: string;
  hPad?: number;
}

/**
 * Active Quests rail — admin-curated city challenges, joined with the user's
 * progress. Hidden when there are no eligible quests for the current
 * city/country (so the screen does not render an empty rail).
 */
export function QuestRail({ city, country, hPad = 16 }: Props) {
  const colors = useColors();
  const { data, isLoading } = useCultureExplorerQuests({ city, country });

  if (isLoading) return null;
  const quests = data?.quests ?? [];
  if (quests.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={{ paddingHorizontal: hPad }}>
        <M3SectionHeader
          title="Active quests"
          subtitle={`Earn bonus points by exploring ${city || 'your city'}`}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, { paddingHorizontal: hPad }]}
      >
        {quests.map((q) => (
          <QuestCard key={q.quest.id} item={q} />
        ))}
      </ScrollView>
      {data?.quests.every((q) => q.progress.completedAt) ? (
        <Text style={[TextStyles.caption, { color: colors.textTertiary, paddingHorizontal: hPad, marginTop: 8 }]}>
          All quests complete — fresh ones are added each month.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  row: {
    gap: 12,
    paddingVertical: 4,
  },
});
