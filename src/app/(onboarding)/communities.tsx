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
import { M3Button, M3Card, M3TopAppBar, M3FilterChip } from '@/design-system/ui';
import * as Haptics from 'expo-haptics';
import { type ColorTheme } from '@/design-system/tokens/colors';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { M3Typography } from '@/design-system/tokens/theme';

export default function CommunitiesScreen() {
  const colors = useColors();
  const m3Colors = useM3Colors();
  const styles = getStyles(colors);
  const { windowSizeClass } = useLayout();
  const isDesktop = windowSizeClass === 'expanded';
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);
  const isExpanded = windowSizeClass === 'expanded';

  const { state, setCommunities } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(state.communities || []);

  const toggle = useCallback((community: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(prev =>
      prev.includes(community) ? prev.filter(c => c !== community) : [...prev, community]
    );
  }, []);

  const handleNext = useCallback(() => {
    if (selected.length === 0) {
      Alert.alert('Select at least one community', 'Choose one or more communities to continue.');
      return;
    }
    setCommunities(selected);
    router.replace(routeWithRedirect('/(onboarding)/culture-match', redirectTo));
  }, [selected, setCommunities, redirectTo]);

  return (
    <View style={[styles.container, { backgroundColor: m3Colors.background }]}>
      <M3TopAppBar
        title="Communities"
        onBack={() => router.canGoBack() ? router.back() : router.replace(routeWithRedirect('/(onboarding)/location', redirectTo))}
        variant={isExpanded ? 'large' : 'medium'}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
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
            { paddingTop: 20 },
          ]}
        >
          <M3Card variant="elevated" style={[styles.formContainer, isDesktop && styles.formContainerDesktop, { padding: 24 }]}>
            <View style={styles.formContent}>
              {/* Header */}
              <View style={styles.headerBlock}>
                <View style={[styles.iconWrapper, { backgroundColor: m3Colors.primaryContainer, borderColor: 'transparent' }]}>
                  <Text style={styles.headerEmoji}>🌏</Text>
                </View>
                <Text style={[styles.title, M3Typography.headlineMedium, { color: m3Colors.onSurface }]}>Your Communities</Text>
                <Text style={[styles.subtitle, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>
                  Connect with cultural groups in your area.
                </Text>
              </View>

              {/* Grouped sections */}
              {communityGroups.map((group) => (
                <View key={group.label} style={styles.section}>
                  {/* Section header */}
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionLabel, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>{group.label.toUpperCase()}</Text>
                    <View style={[styles.sectionLine, { backgroundColor: m3Colors.outlineVariant }]} />
                  </View>

                  {/* Chips */}
                  <View style={styles.chipRow}>
                    {group.members.map((community) => {
                      const isSelected = selected.includes(community);
                      const flag = communityFlags[community] ?? '🌐';
                      return (
                        <M3FilterChip
                          key={community}
                          label={community}
                          selected={isSelected}
                          onPress={() => toggle(community)}
                          icon={flag as any}
                        />
                      );
                    })}
                  </View>
                </View>
              ))}

              <View style={styles.spacer} />

              <M3Button
                variant="filled"
                rightIcon="arrow-forward"
                disabled={selected.length === 0}
                onPress={handleNext}
                style={{ height: 56, borderRadius: 20 }}
              >
                Continue
              </M3Button>
            </View>
          </M3Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (colors: ColorTheme) => StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 60, justifyContent: 'center' },
  scrollContentDesktop: { paddingVertical: 60 },
  formContainer: { width: '100%', maxWidth: 600, alignSelf: 'center', overflow: 'hidden' },
  formContainerDesktop: { maxWidth: 660 },
  formContent: {},

  headerBlock: { alignItems: 'center', marginBottom: 32 },
  iconWrapper: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  headerEmoji: { fontSize: 32 },
  title: { textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center' },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sectionLabel: {},
  sectionLine: { flex: 1, height: 1 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  spacer: { height: 32 },
});
