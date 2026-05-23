import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { QueryClient } from '@tanstack/react-query';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, TextStyles } from '@/design-system/tokens/theme';
import { Button } from '@/design-system/ui/Button';
import { GlassView } from '@/design-system/ui/GlassView';
import { HostspaceActivityCreateForm } from '@/modules/host/components/HostspaceActivityCreateForm';
import { HostspaceOfferCreateForm } from '@/modules/host/components/HostspaceOfferCreateForm';
import { CultureMarketListingWizard } from '@/modules/host/screens/CultureMarketListingWizard';
import {
  GROUP_COLORS,
  GROUP_TABS,
  type CreateCategory,
} from '@/modules/host/config/hostspaceCreateCategories.config';
import type { Profile, ShopListingType } from '@/shared/schema';

export function HostspaceCreateFormPanel({
  selected,
  marketWizardOpen,
  marketWizardSession,
  marketWizardEditId,
  marketWizardSeedType,
  onCloseMarketWizard,
  onListingPublished,
  canCreateSelected,
  requiresParentProfile,
  myProfiles,
  selectedParentProfileId,
  onSelectParentProfileId,
  selectedParentProfile,
  hostInfoVerified,
  onOpenCreateFlow,
}: {
  selected: CreateCategory;
  marketWizardOpen: boolean;
  marketWizardSession: number;
  marketWizardEditId: string | null;
  marketWizardSeedType: ShopListingType | undefined;
  onCloseMarketWizard: () => void;
  onListingPublished: () => void;
  canCreateSelected: boolean;
  requiresParentProfile: boolean;
  myProfiles: Profile[];
  selectedParentProfileId: string | null;
  onSelectParentProfileId: (id: string) => void;
  selectedParentProfile: Profile | null;
  hostInfoVerified: boolean;
  onOpenCreateFlow: () => void;
}) {
  const colors = useColors();
  const isMarket = selected.group === 'market' || selected.contentKind === 'market';

  if (isMarket && marketWizardOpen && canCreateSelected) {
    return (
      <View
        style={[
          styles.formPanel,
          styles.marketWizardHost,
          {
            backgroundColor: colors.surface + '95',
            borderWidth: 1,
            borderColor: colors.borderLight,
          },
        ]}
      >
        <CultureMarketListingWizard
          key={`cm-wizard-${marketWizardSession}`}
          variant="embedded"
          embeddedEditId={marketWizardEditId}
          embeddedInitialType={marketWizardSeedType}
          onClose={onCloseMarketWizard}
          onListingPublished={onListingPublished}
        />
      </View>
    );
  }

  if (selected.contentKind === 'activity' && canCreateSelected) {
    return (
      <View
        style={[
          styles.formPanel,
          styles.embeddedCreateHost,
          { backgroundColor: colors.surface + '95', borderWidth: 1, borderColor: colors.borderLight },
        ]}
      >
        <HostspaceActivityCreateForm />
      </View>
    );
  }

  if (selected.contentKind === 'offer' && canCreateSelected) {
    return (
      <View
        style={[
          styles.formPanel,
          styles.embeddedCreateHost,
          { backgroundColor: colors.surface + '95', borderWidth: 1, borderColor: colors.borderLight },
        ]}
      >
        <HostspaceOfferCreateForm />
      </View>
    );
  }

  return (
    <GlassView
      borderRadius={32}
      style={[styles.formPanel, { backgroundColor: colors.surface + '80' }]}
      contentStyle={styles.formInner}
    >
      <View style={styles.formHeader}>
        <View style={[styles.formIcon, { backgroundColor: selected.color + '15' }]}>
          <Ionicons name={selected.icon} size={32} color={selected.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.formTitle, { color: colors.text }]}>{selected.label}</Text>
          <View style={styles.formBadgeRow}>
            <View
              style={[
                styles.formBadge,
                {
                  backgroundColor: GROUP_COLORS[selected.group] + '18',
                  borderColor: GROUP_COLORS[selected.group] + '40',
                },
              ]}
            >
              <Text style={[styles.formBadgeText, { color: GROUP_COLORS[selected.group] }]}>
                {GROUP_TABS.find((t) => t.id === selected.group)?.label ?? selected.group}
              </Text>
            </View>
            {selected.subCategory ? (
              <View style={[styles.formBadge, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <Text style={[styles.formBadgeText, { color: colors.textTertiary }]}>
                  {selected.subCategory.replace(/_/g, ' ')}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.formMeta, { color: colors.textTertiary }]}>{selected.description}</Text>
        </View>
      </View>

      {requiresParentProfile ? (
        <View
          style={[
            styles.parentBox,
            {
              borderColor: selectedParentProfile ? colors.borderLight : CultureTokens.coral + '70',
              backgroundColor: colors.background + '70',
            },
          ]}
        >
          <View style={styles.parentHeader}>
            <Ionicons
              name="git-branch-outline"
              size={17}
              color={selectedParentProfile ? selected.color : CultureTokens.coral}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.parentTitle, { color: colors.text }]}>Create under</Text>
              <Text style={[styles.parentSub, { color: colors.textSecondary }]}>
                Choose the community, association, organisation, business, venue, charity, council, club, or society that
                owns this item.
              </Text>
            </View>
          </View>
          {myProfiles.length === 0 ? (
            <View style={[styles.emptyState, { borderColor: colors.borderLight, backgroundColor: colors.surface + '70' }]}>
              <Ionicons name="business-outline" size={16} color={colors.textTertiary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                No verified owner profile yet. Create one of the organisation, community, business, or venue types
                first.
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.parentPickerRow}>
              {myProfiles.map((profile) => {
                const active = profile.id === selectedParentProfileId;
                return (
                  <Pressable
                    key={profile.id}
                    onPress={() => onSelectParentProfileId(profile.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Create under ${profile.name}`}
                    accessibilityState={{ selected: active }}
                  >
                    <View
                      style={[
                        styles.parentChip,
                        {
                          borderColor: active ? selected.color : colors.borderLight,
                          backgroundColor: active ? selected.color + '16' : colors.surface,
                        },
                      ]}
                    >
                      <Text style={[styles.parentChipTitle, { color: colors.text }]} numberOfLines={1}>
                        {profile.name}
                      </Text>
                      <Text style={[styles.parentChipSub, { color: colors.textTertiary }]} numberOfLines={1}>
                        {profile.subCategory ?? profile.category ?? profile.entityType}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      ) : null}

      <View style={styles.launchSection}>
        <View style={[styles.launchSummary, { borderColor: colors.borderLight, backgroundColor: colors.background + '70' }]}>
          <Ionicons name="information-circle-outline" size={18} color={selected.color} />
          <Text style={[styles.launchSummaryText, { color: colors.textSecondary }]}>
            {!hostInfoVerified
              ? 'Verify the host setup card above to unlock creation.'
              : requiresParentProfile && !selectedParentProfile
                ? 'Create or select an owner profile before creating this content.'
                : isMarket
                  ? 'Use the buttons below to open the CultureMarket wizard here, or browse the marketplace.'
                  : `Create a new ${selected.label.toLowerCase()} listing, then return here to read, edit, or delete it.`}
          </Text>
        </View>

        <View style={styles.formFieldsRow}>
          <View style={[styles.formFieldHint, { borderColor: colors.borderLight }]}>
            <Ionicons name="layers-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.formFieldHintText, { color: colors.textSecondary }]}>
              Entity type:{' '}
              <Text style={{ fontFamily: 'Poppins_700Bold', color: selected.color }}>{selected.entityType}</Text>
            </Text>
          </View>
          <View style={[styles.formFieldHint, { borderColor: colors.borderLight }]}>
            <Ionicons name="navigate-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.formFieldHintText, { color: colors.textSecondary }]}>
              {isMarket
                ? 'Wizard opens in this column — your listings stay on the right.'
                : 'Multi-step wizard with draft autosave'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Button
          variant="primary"
          size="lg"
          leftIcon="add-circle-outline"
          onPress={onOpenCreateFlow}
          disabled={!canCreateSelected}
          fullWidth
        >
          {isMarket ? 'Open CultureMarket wizard' : `Create ${selected.label}`}
        </Button>
        <Button
          variant="outline"
          size="md"
          leftIcon="open-outline"
          onPress={() => router.push(selected.browseRoute as never)}
          fullWidth
        >
          Browse {selected.label}s
        </Button>
      </View>
    </GlassView>
  );
}

/** Invalidate CultureMarket listings after publish (parent passes queryClient). */
export function invalidateCultureMarketListings(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['culture-market-my-listings'] });
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
  formPanel: {
    flex: 1,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  marketWizardHost: {
    borderRadius: 32,
    minHeight: Platform.OS === 'web' ? 520 : 420,
    maxHeight: Platform.OS === 'web' ? 860 : undefined,
  },
  embeddedCreateHost: {
    borderRadius: 32,
    padding: Platform.OS === 'web' ? 18 : 0,
    minHeight: Platform.OS === 'web' ? 640 : 420,
    maxHeight: Platform.OS === 'web' ? 900 : undefined,
  },
  formInner: {
    padding: Platform.OS === 'web' ? 20 : 32,
    gap: Platform.OS === 'web' ? 18 : 28,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Platform.OS === 'web' ? 14 : 20,
  },
  formIcon: {
    width: Platform.OS === 'web' ? 52 : 64,
    height: Platform.OS === 'web' ? 52 : 64,
    borderRadius: Platform.OS === 'web' ? 16 : 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  formTitle: {
    ...TextStyles.title2,
    fontSize: Platform.OS === 'web' ? 22 : 28,
  },
  formBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 6,
  },
  formBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  formBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formMeta: {
    ...TextStyles.body,
    fontSize: Platform.OS === 'web' ? 13 : 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  parentBox: {
    borderWidth: 1,
    borderRadius: 20,
    padding: Platform.OS === 'web' ? 14 : 16,
    gap: 12,
  },
  parentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  parentTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  parentSub: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins_500Medium',
  },
  parentPickerRow: {
    gap: 10,
    paddingRight: 8,
  },
  parentChip: {
    width: 178,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  parentChipTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  parentChipSub: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  launchSection: {
    gap: Platform.OS === 'web' ? 10 : 14,
  },
  launchSummary: {
    borderWidth: 1,
    borderRadius: 18,
    padding: Platform.OS === 'web' ? 14 : 18,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  launchSummaryText: {
    flex: 1,
    fontSize: Platform.OS === 'web' ? 13 : 14,
    lineHeight: Platform.OS === 'web' ? 19 : 21,
    fontFamily: 'Poppins_500Medium',
  },
  formFieldsRow: {
    gap: 8,
  },
  formFieldHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  formFieldHintText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
  actionRow: {
    gap: Platform.OS === 'web' ? 10 : 12,
  },
});
