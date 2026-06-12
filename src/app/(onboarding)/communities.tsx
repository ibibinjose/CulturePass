import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TextInput,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { communityGroups, communityFlags } from '@/constants/onboardingCommunities';
import {
  M3TopAppBar,
  LuxeButton,
  LuxeCard,
  LuxeText,
} from '@/design-system/ui';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { luxeDark } from '@/design-system/tokens/theme';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import { OnboardingProgressHeader } from '@/components/onboarding/OnboardingProgressHeader';
import { OnboardingDestinationBanner } from '@/components/onboarding/OnboardingDestinationBanner';
import { useAuth } from '@/lib/auth';
import { syncOnboardingProfilePatch } from '@/lib/syncOnboardingProfile';

export default function CommunitiesScreen() {
  const m3Colors = useM3Colors();
  const { windowSizeClass } = useLayout();
  const isDesktop = windowSizeClass === 'expanded';

  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const { user } = useAuth();
  const { state, setCommunities, skipStep, completeStep } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(state.communities || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toggle = useCallback((community: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(prev =>
      prev.includes(community)
        ? prev.filter(c => c !== community)
        : [...prev, community]
    );
  }, []);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return communityGroups;
    return communityGroups
      .map((group) => ({
        ...group,
        members: group.members.filter((m) => m.toLowerCase().includes(q)),
      }))
      .filter((group) => group.members.length > 0);
  }, [searchQuery]);

  const handleNext = useCallback(async () => {
    if (selected.length === 0 || isSaving) return;
    setIsSaving(true);
    setCommunities(selected);
    await syncOnboardingProfilePatch(user?.id, { communities: selected });
    await completeStep('communities').catch(() => {});
    router.replace(routeWithRedirect('/(onboarding)/culture-match', redirectTo) as string);
    setIsSaving(false);
  }, [selected, setCommunities, redirectTo, user?.id, completeStep, isSaving]);

  const handleSkip = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    setCommunities([]);
    await skipStep('communities').catch(() => {});
    router.replace(routeWithRedirect('/(onboarding)/culture-match', redirectTo) as string);
    setIsSaving(false);
  }, [setCommunities, skipStep, redirectTo, isSaving]);

  const selectedCount = selected.length;

  return (
    <View style={[styles.container, { backgroundColor: m3Colors.background }]}>
      <M3TopAppBar
        title="Communities"
        onBack={() => router.canGoBack() 
          ? router.back() 
          : router.replace(routeWithRedirect('/(onboarding)/location', redirectTo))
        }
        variant={isDesktop ? 'large' : 'medium'}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 40, height: 40, borderRadius: 20 }}
            contentFit="contain"
          />
        }
      />

      <OnboardingProgressHeader currentStep="communities" redirectTo={redirectTo} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.scrollContentDesktop,
          ]}
        >
          <Animated.View
            entering={FadeInDown.springify().damping(20).stiffness(120).delay(100)}
            style={{ width: '100%' }}
          >
            <LuxeCard
              variant="glass"
              style={[
                styles.formContainer,
                isDesktop && styles.formContainerDesktop,
              ]}
            >
            {redirectTo ? (
              <OnboardingDestinationBanner redirectTo={redirectTo} variant="step" />
            ) : null}

            {/* Hero Header */}
            <View style={styles.header}>
              <View style={styles.emojiCircle}>
                <Text style={styles.emoji}>🌍</Text>
              </View>
              <LuxeText variant="display" style={styles.title}>
                What communities do you belong to?
              </LuxeText>
              <LuxeText variant="body" style={styles.subtitle}>
                Select the cultural, ethnic, or interest groups you identify with. 
                This helps us connect you with relevant people and events nearby.
              </LuxeText>

              {selectedCount > 0 && (
                <View style={styles.selectionBadge}>
                  <LuxeText variant="badge" style={styles.selectionText}>
                    {selectedCount} selected
                  </LuxeText>
                </View>
              )}
            </View>

            <View style={[styles.searchBar, { backgroundColor: luxeDark.surfaceElevated, borderColor: luxeDark.border }]}>
              <Ionicons name="search" size={20} color={luxeDark.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: luxeDark.text }]}
                placeholder="Search communities…"
                placeholderTextColor={luxeDark.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Search communities"
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={20} color={luxeDark.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            {/* Community Groups */}
            <View style={styles.groupsContainer}>
              {filteredGroups.length === 0 ? (
                <LuxeText variant="body" style={{ textAlign: 'center', color: luxeDark.textSecondary, paddingVertical: 24 }}>
                  No communities match your search.
                </LuxeText>
              ) : null}
              {filteredGroups.map((group) => (
                <View key={group.label} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <LuxeText variant="title3" style={styles.sectionTitle}>
                      {group.label}
                    </LuxeText>
                  </View>

                  {/* Vertical list — top to bottom, one card per line (same pattern as States & City) */}
                  <View style={styles.groupList}>
                    {group.members.map((community) => {
                      const isSelected = selected.includes(community);
                      const flag = communityFlags[community] ?? '🌐';

                      return (
                        <LuxeCard
                          key={community}
                          variant={isSelected ? "tonal" : "default"}
                          onPress={() => toggle(community)}
                          style={styles.groupCard}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 }}>
                            <Text style={{ fontSize: 20 }}>{flag}</Text>
                            <LuxeText 
                              variant="bodyMedium" 
                              style={{ color: isSelected ? luxeDark.onPrimaryContainer : luxeDark.text, flex: 1 }}
                            >
                              {community}
                            </LuxeText>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={20} color={luxeDark.onPrimaryContainer} />
                            )}
                          </View>
                        </LuxeCard>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.footerSpacer} />

            <LuxeButton
              variant="filled"
              rightIcon="arrow-forward"
              disabled={selected.length === 0 || isSaving}
              loading={isSaving}
              onPress={handleNext}
              size="lg"
            >
              {selected.length === 0 ? 'Select at least one' : 'Continue'}
            </LuxeButton>

            <LuxeButton
              variant="glass"
              onPress={handleSkip}
              disabled={isSaving}
              style={{ marginTop: 12 }}
            >
              Skip for now
            </LuxeButton>
          </LuxeCard>
        </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 80,
    paddingTop: 24,
  },
  scrollContentDesktop: {
    paddingTop: 60,
    paddingBottom: 100,
  },

  formContainer: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    padding: 28,
    borderRadius: 28,
  },
  formContainerDesktop: {
    padding: 40,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emojiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: luxeDark.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 42,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 480,
    opacity: 0.85,
  },
  selectionBadge: {
    marginTop: 16,
    backgroundColor: luxeDark.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  selectionText: {
    color: luxeDark.primary,
  },

  // Groups
  groupsContainer: {
    gap: 36,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: luxeDark.textSecondary,
    letterSpacing: 0.5,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    marginBottom: 4, // helps with last row spacing
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },

  footerSpacer: {
    height: 48,
  },

  // Vertical list for community groups (top to bottom, full-width cards — same as States/City)
  groupList: {
    gap: 10,
  },
  groupCard: {
    width: '100%',
    borderRadius: 16,
  },
});