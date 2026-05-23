import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Button } from '@/design-system/ui/Button';
import { GlassView } from '@/design-system/ui/GlassView';
import type { CreateCategory } from '@/modules/host/config/hostspaceCreateCategories.config';
import type { Profile, ShopListing } from '@/shared/schema';

export function HostspaceCreateListingsColumn({
  selected,
  isMarket,
  itemCount,
  shopListingsLoading,
  profilesLoading,
  userSignedIn,
  filteredShopListings,
  filteredListings,
  onOpenCreateFlow,
  onEditShopListing,
  onDeleteShopListing,
  onEditListing,
  onDeleteListing,
}: {
  selected: CreateCategory;
  isMarket: boolean;
  itemCount: number;
  shopListingsLoading: boolean;
  profilesLoading: boolean;
  userSignedIn: boolean;
  filteredShopListings: ShopListing[];
  filteredListings: Profile[];
  onOpenCreateFlow: () => void;
  onEditShopListing: (listing: ShopListing) => void;
  onDeleteShopListing: (listing: ShopListing) => void;
  onEditListing: (profile: Profile) => void;
  onDeleteListing: (profile: Profile) => void;
}) {
  const colors = useColors();
  const isDark = useIsDark();
  const { isDesktop } = useLayout();

  return (
    <View style={[styles.outputColumn, !isDesktop && styles.outputColumnMobile]}>
      <GlassView
        intensity={12}
        style={[
          styles.outputCard,
          !isDark && { backgroundColor: colors.surface, borderColor: colors.borderLight },
          isDark && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)' },
        ]}
      >
        <View style={styles.outputHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.outputTitle, { color: colors.text }]}>
              {isMarket ? 'Your CultureMarket listings' : 'Your listings'}
            </Text>
            <Text style={[styles.outputSub, { color: colors.textSecondary }]}>
              {isMarket
                ? 'Products, services, and links you have published to CultureMarket.'
                : `Directory profiles that match “${selected.label}”.`}
            </Text>
          </View>
          <View style={[styles.outputPill, { borderColor: colors.borderLight }]}>
            <Text style={[styles.outputPillText, { color: colors.text }]}>{itemCount}</Text>
            <Text style={[styles.outputPillLabel, { color: colors.textTertiary }]}>Items</Text>
          </View>
        </View>

        <Button variant="primary" size="sm" leftIcon="add-outline" onPress={onOpenCreateFlow} fullWidth>
          {isMarket ? 'New CultureMarket listing' : `Create New ${selected.label}`}
        </Button>

        {isMarket ? (
          shopListingsLoading ? (
            <View style={styles.outputLoading}>
              <Text style={[styles.outputSub, { color: colors.textSecondary }]}>Loading your listings...</Text>
            </View>
          ) : !userSignedIn ? (
            <View style={[styles.emptyState, { borderColor: colors.borderLight, backgroundColor: colors.background + '70' }]}>
              <Ionicons name="person-outline" size={16} color={colors.textTertiary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Sign in to see your CultureMarket listings.
              </Text>
            </View>
          ) : filteredShopListings.length === 0 ? (
            <View style={[styles.emptyState, { borderColor: colors.borderLight, backgroundColor: colors.background + '70' }]}>
              <Ionicons name="storefront-outline" size={16} color={colors.textTertiary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Nothing published yet for this filter. Create a listing to appear on CultureMarket.
              </Text>
            </View>
          ) : (
            <View style={styles.outputGrid}>
              {filteredShopListings.slice(0, 8).map((listing) => (
                <View key={listing.id} style={styles.outputRow}>
                  <Text style={[styles.outputLabel, { color: colors.textTertiary }]}>{listing.type}</Text>
                  <Text style={[styles.outputValue, { color: colors.text }]} numberOfLines={2}>
                    {listing.title}
                  </Text>
                  <View style={styles.outputActions}>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon="create-outline"
                      onPress={() => onEditShopListing(listing)}
                      style={{ flex: 1 }}
                      accessibilityLabel={`Edit ${listing.title}`}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon="trash-outline"
                      onPress={() => onDeleteShopListing(listing)}
                      style={{ flex: 1 }}
                      accessibilityLabel={`Remove ${listing.title}`}
                    >
                      Remove
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          )
        ) : profilesLoading ? (
          <View style={styles.outputLoading}>
            <Text style={[styles.outputSub, { color: colors.textSecondary }]}>Loading listings...</Text>
          </View>
        ) : filteredListings.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: colors.borderLight, backgroundColor: colors.background + '70' }]}>
            <Ionicons name="document-text-outline" size={16} color={colors.textTertiary} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No {selected.label.toLowerCase()} listings yet.
            </Text>
          </View>
        ) : (
          <View style={styles.outputGrid}>
            {filteredListings.slice(0, 8).map((profile) => (
              <View key={profile.id} style={styles.outputRow}>
                <Text style={[styles.outputLabel, { color: colors.textTertiary }]}>{profile.entityType}</Text>
                <Text style={[styles.outputValue, { color: colors.text }]} numberOfLines={1}>
                  {profile.name}
                </Text>
                <View style={styles.outputActions}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon="create-outline"
                    onPress={() => onEditListing(profile)}
                    style={{ flex: 1 }}
                    accessibilityLabel={`Edit ${profile.name}`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon="trash-outline"
                    onPress={() => onDeleteListing(profile)}
                    style={{ flex: 1 }}
                    accessibilityLabel={`Delete ${profile.name}`}
                  >
                    Delete
                  </Button>
                </View>
              </View>
            ))}
          </View>
        )}
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyStateText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
  outputColumn: {
    width: Platform.OS === 'web' ? 286 : 320,
    gap: Platform.OS === 'web' ? 10 : 16,
  },
  outputColumnMobile: {
    width: '100%',
  },
  outputCard: {
    borderRadius: 24,
    padding: Platform.OS === 'web' ? 16 : 24,
    gap: Platform.OS === 'web' ? 10 : 16,
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outputTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: Platform.OS === 'web' ? 16 : 18,
  },
  outputSub: {
    fontSize: Platform.OS === 'web' ? 11 : 12,
    opacity: 0.6,
  },
  outputPill: {
    paddingHorizontal: Platform.OS === 'web' ? 8 : 10,
    paddingVertical: Platform.OS === 'web' ? 3 : 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  outputPillText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: Platform.OS === 'web' ? 13 : 14,
  },
  outputPillLabel: {
    fontSize: Platform.OS === 'web' ? 8 : 9,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  outputGrid: {
    gap: Platform.OS === 'web' ? 8 : 12,
  },
  outputRow: {
    gap: 8,
    marginBottom: 8,
  },
  outputActions: {
    flexDirection: 'row',
    gap: 8,
  },
  outputLoading: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  outputLabel: {
    fontSize: Platform.OS === 'web' ? 9 : 10,
    fontFamily: 'Poppins_700Bold',
    opacity: 0.5,
    textTransform: 'uppercase',
  },
  outputValue: {
    fontSize: Platform.OS === 'web' ? 12 : 13,
    fontFamily: 'Poppins_500Medium',
  },
});
