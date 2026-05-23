import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { CULTURES } from '@/constants/cultures';
import { CultureTokens } from '@/design-system/tokens/theme';
import type { CulturePassportBadge } from '@/shared/schema';

const TILE_SIZE = 64;
const RING_STROKE = 4;
const RING_RADIUS = (TILE_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface Props {
  badge: CulturePassportBadge;
  onPress?: () => void;
}

/**
 * Single badge in the Cultural Passport panel — circular tile with a progress
 * ring, the culture's emoji (when known), and a label below.
 *
 * Visual language: Indigo progress ring on a translucent dark surface so the
 * tile sits clean on top of the SignatureGradient panel background.
 */
export function CultureBadgeTile({ badge, onPress }: Props) {
  const culture = CULTURES[badge.cultureId];
  const label = culture?.label ?? badge.cultureLabel;
  const emoji = culture?.emoji;
  const isMaxTier = badge.nextTierAt == null;

  const progress = useMemo(() => {
    if (isMaxTier) return 1;
    const denom = badge.nextTierAt ?? 1;
    if (denom <= 0) return 0;
    return Math.min(1, Math.max(0, badge.eventsAttended / denom));
  }, [badge.eventsAttended, badge.nextTierAt, isMaxTier]);

  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <Pressable
      style={styles.tile}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${badge.badgeTier} tier, ${badge.eventsAttended} events attended`}
    >
      <View style={styles.ring}>
        <Svg width={TILE_SIZE} height={TILE_SIZE}>
          <Circle
            cx={TILE_SIZE / 2}
            cy={TILE_SIZE / 2}
            r={RING_RADIUS}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={RING_STROKE}
            fill="rgba(0,0,0,0.25)"
          />
          <Circle
            cx={TILE_SIZE / 2}
            cy={TILE_SIZE / 2}
            r={RING_RADIUS}
            stroke={CultureTokens.indigo}
            strokeWidth={RING_STROKE}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${TILE_SIZE / 2} ${TILE_SIZE / 2})`}
          />
        </Svg>
        <View style={styles.center} pointerEvents="none">
          {emoji ? (
            <Text style={styles.emoji}>{emoji}</Text>
          ) : (
            <Text style={styles.initial}>{label.slice(0, 1).toUpperCase()}</Text>
          )}
        </View>
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.subLabel} numberOfLines={1}>
        {isMaxTier
          ? 'Champion'
          : `${badge.eventsAttended}/${badge.nextTierAt ?? '?'} ${badge.nextTierLabel ?? ''}`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 84,
    alignItems: 'center',
    gap: 6,
  },
  ring: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 28 },
  initial: {
    fontSize: 22,
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  subLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
});
