import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  CultureTokens,
  Radius,
  SignatureGradient,
} from '@/design-system/tokens/theme';
import { CultureBadgeTile } from './CultureBadgeTile';
import { useCultureExplorerSummary } from '@/hooks/queries/useCultureExplorer';

interface Props {
  /** Optional override; defaults to navigating to profile edit. */
  onEditExploring?: () => void;
}

/**
 * Cultural Passport panel — single instance of `SignatureGradient` per /explore
 * screen (per the docs/DESIGN_TOKENS.md "max ONE per screen" rule). Displays
 * total points, bonus points earned, and a horizontally-scrollable list of
 * culture badge tiles with progress rings.
 *
 * Empty state: invites the user to declare cultures they want to explore,
 * which is the precondition for the Passport to start filling.
 */
export function CulturePassportPanel({ onEditExploring }: Props) {
  const { data, isLoading, isError } = useCultureExplorerSummary();

  const goEdit = onEditExploring ?? (() => router.push('/profile/edit'));

  const hasBadges = (data?.badges?.length ?? 0) > 0;
  const exploringCount = data?.exploringCultureIds?.length ?? 0;
  const totalPoints = data?.totalPoints ?? 0;
  const bonusPoints = data?.bonusPointsEarned ?? 0;

  return (
    <LinearGradient
      colors={SignatureGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.panel}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>YOUR CULTURE PASSPORT</Text>
          <Text style={styles.title}>Connecting cultures, building belonging. Earn points exploring.</Text>
        </View>
        <Pressable
          onPress={goEdit}
          hitSlop={10}
          style={styles.editChip}
          accessibilityRole="button"
          accessibilityLabel="Edit cultures you want to explore"
        >
          <Ionicons name="settings-outline" size={14} color="#FFFFFF" />
          <Text style={styles.editChipLabel}>Edit</Text>
        </Pressable>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{totalPoints.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total points</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>+{bonusPoints.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Bonus from exploring</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{data?.badges.length ?? 0}</Text>
          <Text style={styles.statLabel}>Cultures collected</Text>
        </View>
      </View>

      {/* Badges row */}
      {isLoading ? (
        <Text style={styles.helperText}>Loading your passport…</Text>
      ) : isError ? (
        <Text style={styles.helperText}>Could not load passport. Pull to refresh.</Text>
      ) : hasBadges ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgesRow}
        >
          {data!.badges.map((badge) => (
            <CultureBadgeTile key={badge.cultureId} badge={badge} />
          ))}
        </ScrollView>
      ) : exploringCount === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.helperText}>
            Pick cultures you’re curious about. Their events earn 2x points and unlock
            badges on your passport.
          </Text>
          <Pressable onPress={goEdit} style={styles.cta}>
            <Text style={styles.ctaLabel}>Pick cultures to explore</Text>
            <Ionicons name="arrow-forward" size={16} color={CultureTokens.violet} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.helperText}>
            Attend an event from one of the {exploringCount} cultures you’re exploring to
            earn your first badge.
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: Radius.xl,
    padding: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 26,
    fontFamily: 'Poppins_700Bold',
  },
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  editChipLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 16,
  },
  statBlock: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginHorizontal: 6,
  },
  badgesRow: {
    paddingVertical: 4,
    gap: 16,
  },
  helperText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
  },
  emptyState: {
    gap: 12,
  },
  cta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  ctaLabel: {
    color: CultureTokens.violet,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
});
