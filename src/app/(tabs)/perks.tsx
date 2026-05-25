import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { GlassView } from '@/design-system/ui/GlassView';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { HeaderTokens } from '@/design-system/tokens/theme';

export default function PerksTabScreen() {
  const colors = useColors();
  const { hPad } = useLayout();
  
  const { data: perks, isLoading, isError, refetch } = useQuery({
    queryKey: ['perks'],
    queryFn: () => api.perks.list({}),
  });

  return (
    <ErrorBoundary>
      <AuthGuard 
        icon="pricetag-outline" 
        title="Sign in to access perks" 
        message="Your exclusive member perks are available after you sign in."
      >
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
          }
        >
          {/* Header */}
          <View style={[styles.header, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.title, { color: colors.text }]}>Perks</Text>
          </View>

          {/* Content */}
          <View style={{ paddingHorizontal: hPad, paddingTop: 20 }}>
            {isLoading ? (
              <View style={styles.loadingState}>
                <Ionicons name="reload" size={48} color={colors.primary} />
                <Text style={[styles.stateText, { color: colors.textSecondary }]}>Loading perks...</Text>
              </View>
            ) : isError ? (
              <View style={styles.errorState}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                <Text style={[styles.stateText, { color: colors.text }]}>Failed to load perks</Text>
                <Text style={[styles.stateText, { color: colors.textSecondary }]}>Check your connection and try again</Text>
              </View>
            ) : perks && perks.length > 0 ? (
              <View style={styles.perksList}>
                {perks.map((perk: { id?: string; title?: string; description?: string; discountPercent?: number; partnerName?: string }, index: number) => (
                  <GlassView key={perk.id || index} contentStyle={styles.perkCard}>
                    <View style={styles.perkHeader}>
                      <Text style={[styles.perkTitle, { color: colors.text }]}>{perk.title}</Text>
                      <View style={[styles.perkBadge, { backgroundColor: colors.primarySoft }]}>
                        <Text style={[styles.perkBadgeText, { color: colors.primary }]}>
                          {perk.discountPercent ? `${perk.discountPercent}% OFF` : 'SPECIAL'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.perkDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                      {perk.description}
                    </Text>
                    {perk.partnerName && (
                      <Text style={[styles.perkPartner, { color: colors.textTertiary }]}>
                        {perk.partnerName}
                      </Text>
                    )}
                  </GlassView>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="pricetag-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.stateText, { color: colors.text }]}>No perks available</Text>
                <Text style={[styles.stateText, { color: colors.textSecondary, textAlign: 'center' }]}>
                  Check back later for exclusive member discounts and offers
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </AuthGuard>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    minHeight: HeaderTokens.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  title: { fontSize: 24, fontFamily: 'Poppins_700Bold', letterSpacing: -0.5 },
  
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  stateText: { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  
  perksList: {
    gap: 12,
  },
  perkCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  perkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  perkTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
  },
  perkBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  perkBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  perkDescription: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
  perkPartner: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    marginTop: 4,
  },
});