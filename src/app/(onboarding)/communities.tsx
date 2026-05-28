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
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { communityGroups, communityFlags } from '@/constants/onboardingCommunities';
import {
  M3TopAppBar,
  LuxeButton,
  LuxeCard,
  LuxeText,
  LuxeFilterChip,
} from '@/design-system/ui';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { luxeDark } from '@/design-system/tokens/theme';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';

export default function CommunitiesScreen() {
  const colors = useColors();
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
          <LuxeCard
            variant="default"
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
                    <LuxeText variant="titleSmall" style={styles.sectionTitle}>
                      {group.label}
                    </LuxeText>
                  </View>

                  <View style={styles.chipContainer}>
                    {group.members.map((community) => {
                      const isSelected = selected.includes(community);
                      const flag = communityFlags[community] ?? '🌐';

                      return (
                        <LuxeFilterChip
                          key={community}
                          label={community}
                          selected={isSelected}
                          onPress={() => toggle(community)}
                          icon={flag as any}
                          style={styles.chip}
                        />
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
              size="large"
            >
              Continue
            </LuxeButton>
          </LuxeCard>
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
});