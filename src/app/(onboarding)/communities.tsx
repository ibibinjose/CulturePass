import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
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

export default function CommunitiesScreen() {
  const m3Colors = useM3Colors();
  const { windowSizeClass } = useLayout();
  const isDesktop = windowSizeClass === 'expanded';

  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const { state, setCommunities } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(state.communities || []);

  const toggle = useCallback((community: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(prev =>
      prev.includes(community)
        ? prev.filter(c => c !== community)
        : [...prev, community]
    );
  }, []);

  const handleNext = useCallback(() => {
    if (selected.length === 0) {
      Alert.alert('Select at least one', 'Choose one or more communities to continue.');
      return;
    }
    setCommunities(selected);
    router.replace(routeWithRedirect('/(onboarding)/culture-match', redirectTo));
  }, [selected, setCommunities, redirectTo]);

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

            {/* Community Groups */}
            <View style={styles.groupsContainer}>
              {communityGroups.map((group) => (
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
              disabled={selected.length === 0}
              onPress={handleNext}
              size="lg"
            >
              Continue
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