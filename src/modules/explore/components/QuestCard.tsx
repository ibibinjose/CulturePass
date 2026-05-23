import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, Radius, TextStyles } from '@/design-system/tokens/theme';
import type { CultureQuestWithProgress } from '@/shared/schema';

interface Props {
  item: CultureQuestWithProgress;
  onPress?: () => void;
  width?: number;
}

/**
 * Single quest tile — title, target progress bar, reward chip. Outlined card
 * (M3 style) without colored left borders (AI slop). Category accent is a
 * 6px dot to the left of the title.
 */
export function QuestCard({ item, onPress, width = 260 }: Props) {
  const colors = useColors();
  const { quest, progress } = item;
  const isComplete = Boolean(progress.completedAt);

  const pct = useMemo(() => {
    if (quest.targetCount <= 0) return 0;
    return Math.min(1, Math.max(0, progress.count / quest.targetCount));
  }, [progress.count, quest.targetCount]);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          width,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${quest.title}, ${progress.count} of ${quest.targetCount} complete`}
    >
      <View style={styles.titleRow}>
        <View style={[styles.dot, { backgroundColor: CultureTokens.violet }]} />
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={2}
        >
          {quest.title}
        </Text>
      </View>

      {quest.description ? (
        <Text
          style={[styles.description, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {quest.description}
        </Text>
      ) : null}

      <View style={styles.spacer} />

      <View style={styles.progressRow}>
        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
          {progress.count}/{quest.targetCount} events
        </Text>
        <View style={styles.rewardChip}>
          {isComplete ? (
            <>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={[styles.rewardChipLabel, { color: colors.success }]}>
                Complete
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="ribbon-outline" size={14} color={CultureTokens.violet} />
              <Text style={[styles.rewardChipLabel, { color: CultureTokens.violet }]}>
                +{quest.rewardPoints.toLocaleString()} pts
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={[styles.bar, { backgroundColor: colors.surfaceSecondary ?? colors.background }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${pct * 100}%`,
              backgroundColor: isComplete ? colors.success : CultureTokens.violet,
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    minHeight: 140,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  title: {
    ...TextStyles.headline,
    flex: 1,
    fontSize: 15,
    lineHeight: 19,
  },
  description: {
    ...TextStyles.caption,
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
  },
  spacer: { flex: 1, minHeight: 8 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    fontVariant: ['tabular-nums'],
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardChipLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    fontVariant: ['tabular-nums'],
  },
  bar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
});
