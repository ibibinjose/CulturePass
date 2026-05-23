import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import {
  CultureTokens,
  FontFamily,
  M3Typography,
} from '@/design-system/tokens/theme';
import { sanitizeInternalRedirect } from '@/lib/routes';
import { HOST_TYPE_OPTIONS, type HostType } from '@/shared/schema';
import { M3Button, M3TopAppBar } from '@/design-system/ui';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { captureEvent } from '@/lib/analytics';

const TYPE_ACCENT: Record<HostType, string> = {
  creator:   CultureTokens.coral,
  business:  CultureTokens.violet,
  organizer: CultureTokens.teal,
  venue:     CultureTokens.gold,
  community: CultureTokens.teal,
};

export default function OnboardingHostApplicationScreen() {
  const m3Colors = useM3Colors();
  const { isDesktop, windowSizeClass } = useLayout();
  const insets = useSafeAreaInsets();
  
  // Get redirectTo from search params
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const isExpanded = windowSizeClass === 'expanded';
  const { completeOnboarding } = useOnboarding();

  const [selectedTypes, setSelectedTypes] = useState<HostType[]>([]);

  const toggleType = (type: HostType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const selectAll = () => {
    if (selectedTypes.length === HOST_TYPE_OPTIONS.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes(HOST_TYPE_OPTIONS.map((o) => o.id));
    }
  };

  const handleFinish = async () => {
    if (selectedTypes.length > 0) {
      // If they selected types, they want to be a host.
      // We'll redirect them to the full application form after onboarding.
      captureEvent('host_application_started', {
        selected_types: selectedTypes,
        type_count: selectedTypes.length,
      });
      await completeOnboarding();
      router.replace({
          pathname: '/hostspace/apply',
          params: { initialTypes: selectedTypes.join(',') }
      } as any);
    } else {
      await completeOnboarding();
      // Use redirectTo if available, otherwise default to tabs
      router.replace((redirectTo ?? '/(tabs)') as any);
    }
  };

  const handleSkip = async () => {
    captureEvent('host_application_skipped', {
      had_selections: selectedTypes.length > 0,
    });
    await completeOnboarding();
    // Use redirectTo if available, otherwise default to tabs
    router.replace((redirectTo ?? '/(tabs)') as any);
  };

  return (
    <View style={[s.root, { backgroundColor: m3Colors.background }]}>
      <M3TopAppBar
        title="Creator Program"
        onBack={() => router.back()}
        variant={isExpanded ? 'large' : 'medium'}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
            contentFit="contain"
          />
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.scrollContent,
          isDesktop && s.scrollContentDesktop,
          { paddingBottom: bottomInset + 120 },
        ]}
      >
        <Animated.View entering={FadeInUp.springify().damping(16).delay(100)}>
          <View style={s.titleBlock}>
            <Text style={[s.title, M3Typography.displaySmall, { color: m3Colors.onSurface }]}>Are you a creator{'\n'}or organizer?</Text>
            <Text style={[s.subtitle, M3Typography.bodyLarge, { color: m3Colors.onSurfaceVariant }]}>
              Join the CulturePass Host Program to list events, sell tickets, and grow your community.
            </Text>
          </View>

          <View style={s.grid}>
            {HOST_TYPE_OPTIONS.map((opt, i) => {
              const ac = TYPE_ACCENT[opt.id];
              const active = selectedTypes.includes(opt.id);
              return (
                <Animated.View key={opt.id} entering={FadeInDown.delay(150 + i * 50).springify()}>
                  <Pressable
                    onPress={() => toggleType(opt.id)}
                    style={({ pressed }) => [
                      s.typeCard,
                      { backgroundColor: m3Colors.surfaceContainerLow, borderColor: active ? ac : m3Colors.outlineVariant },
                      active && { borderWidth: 2 },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <View style={[s.iconWrap, { backgroundColor: ac + '1A' }]}>
                      <Ionicons name={opt.icon as any} size={24} color={ac} />
                    </View>
                    <View style={s.cardBody}>
                        <Text style={[s.cardLabel, M3Typography.titleSmall, { color: m3Colors.onSurface }]}>{opt.label}</Text>
                        <Text style={[s.cardDesc, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]} numberOfLines={2}>{opt.desc}</Text>
                    </View>
                    <View style={[s.check, { borderColor: active ? ac : m3Colors.outline, backgroundColor: active ? ac : 'transparent' }]}>
                        {active && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}

            <Animated.View entering={FadeInDown.delay(150 + HOST_TYPE_OPTIONS.length * 50).springify()}>
                <Pressable
                    onPress={selectAll}
                    style={({ pressed }) => [
                        s.typeCard,
                        { backgroundColor: m3Colors.surfaceContainerLow, borderColor: selectedTypes.length === HOST_TYPE_OPTIONS.length ? m3Colors.primary : m3Colors.outlineVariant },
                        selectedTypes.length === HOST_TYPE_OPTIONS.length && { borderWidth: 2 },
                        pressed && { opacity: 0.8 },
                    ]}
                >
                    <View style={[s.iconWrap, { backgroundColor: m3Colors.primaryContainer }]}>
                        <Ionicons name="grid-outline" size={24} color={m3Colors.onPrimaryContainer} />
                    </View>
                    <View style={s.cardBody}>
                        <Text style={[s.cardLabel, M3Typography.titleSmall, { color: m3Colors.onSurface }]}>All of the above</Text>
                        <Text style={[s.cardDesc, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>I manage multiple cultural roles.</Text>
                    </View>
                </Pressable>
            </Animated.View>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInDown.springify().damping(20).delay(300)} style={[s.bottomBar, { paddingBottom: bottomInset + 16, backgroundColor: m3Colors.background }]}>
        <M3Button
          variant="filled"
          fullWidth
          onPress={handleFinish}
          style={{ height: 56, borderRadius: 20 }}
        >
          {selectedTypes.length > 0 ? 'Continue to Application' : 'Start Exploring'}
        </M3Button>
        <M3Button
            variant="text"
            onPress={handleSkip}
        >
            Skip for now
        </M3Button>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  scrollContentDesktop: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  titleBlock: {
    marginBottom: 32,
    gap: 12,
  },
  title: {
    lineHeight: 40,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    opacity: 0.8,
  },
  grid: {
    gap: 12,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardLabel: {
    fontFamily: FontFamily.bold,
  },
  cardDesc: {
    opacity: 0.7,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 8,
  },
});
