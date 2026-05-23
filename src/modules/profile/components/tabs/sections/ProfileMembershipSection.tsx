import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { M3Button, GlassView } from '@/design-system/ui';
import { TIER_CFG, memberDate } from '@/modules/profile/components/tabs/ProfileUtils';
import { tier as tierStyles } from '@/modules/profile/components/tabs/ProfileStyles';
import { calculateTierProgress } from '@/lib/my-space-utils';
import { FontFamily } from '@/design-system/tokens/theme';

// Tier point thresholds (approximate; replace with server values when available)
const TIER_THRESHOLDS: Record<string, { min: number; next: number }> = {
  free:    { min: 0,    next: 500  },
  plus:    { min: 500,  next: 2000 },
  elite:   { min: 2000, next: 5000 },
  pro:     { min: 5000, next: 10000 },
  premium: { min: 10000, next: 20000 },
  vip:     { min: 20000, next: 20000 },
};

interface ProfileMembershipSectionProps {
  tierKey: string;
  createdAt?: string;
  /** User's current reward points balance (from wallet/profile data). */
  rewardPoints?: number;
  nav: (path: string) => void;
}

export const ProfileMembershipSection = React.memo(({
  tierKey,
  createdAt,
  rewardPoints = 0,
  nav,
}: ProfileMembershipSectionProps) => {
  const m3 = useM3Colors();
  const { hPad } = useLayout();

  const tierConf = TIER_CFG[tierKey] ?? TIER_CFG.free;
  const since = memberDate(createdAt);
  const isFree = !tierKey || tierKey === 'free';
  const isVip = tierKey === 'vip';

  const thresholds = TIER_THRESHOLDS[tierKey] ?? TIER_THRESHOLDS.free;
  const { percentage, pointsRemaining } = calculateTierProgress(
    rewardPoints,
    thresholds.min,
    thresholds.next,
  );

  return (
    <View style={[styles.section, { paddingHorizontal: hPad }]}>
      <GlassView contentStyle={{ padding: 0, overflow: 'hidden' }}>
        <LinearGradient
          colors={[tierConf.color + '22', tierConf.color + '08', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[tierStyles.card, { borderWidth: 0, padding: 20 }]}
        >
          <View style={tierStyles.left}>
            <View style={[tierStyles.iconWrap, { backgroundColor: tierConf.color + '20' }]}>
              <Ionicons name={tierConf.icon} size={22} color={tierConf.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[tierStyles.label, { color: m3.onSurface }]}>{tierConf.label} Member</Text>
              {since ? <Text style={[tierStyles.since, { color: m3.onSurfaceVariant }]}>Member since {since}</Text> : null}
            </View>
          </View>

          {/* Tier progress bar (Req 8.4) */}
          {!isVip && (
            <View style={styles.progressBlock}>
              <View style={[styles.progressTrack, { backgroundColor: tierConf.color + '20' }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${percentage}%` as `${number}%`, backgroundColor: tierConf.color },
                  ]}
                />
              </View>
              <Text style={[styles.progressLabel, { color: m3.onSurfaceVariant }]}>
                {isVip ? 'Top tier' : `${pointsRemaining.toLocaleString()} pts to next tier`}
              </Text>
            </View>
          )}

          {isFree ? (
            <M3Button
              variant="filled"
              onPress={() => nav('/membership/upgrade')}
              rightIcon="arrow-forward"
              style={{ height: 44, marginTop: 12 }}
            >
              Upgrade
            </M3Button>
          ) : null}
        </LinearGradient>
      </GlassView>
    </View>
  );
});

ProfileMembershipSection.displayName = 'ProfileMembershipSection';

const styles = StyleSheet.create({
  section: { marginTop: 36 },
  progressBlock: { marginTop: 14, gap: 6 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 11, fontFamily: FontFamily.regular },
});
