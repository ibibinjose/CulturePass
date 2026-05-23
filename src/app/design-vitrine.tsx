/**
 * Digital Vitrine design preview — open /design-vitrine (web or native).
 * Tokens: constants/vitrineTheme.ts · Narrative: docs/DESIGN_SYSTEM_VITRINE.md
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFonts, Newsreader_400Regular, Newsreader_700Bold } from '@expo-google-fonts/newsreader';
import { Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { Ionicons } from '@expo/vector-icons';

import { Vitrine, vitrineGhostBorder } from '@/design-system/tokens/vitrineTheme';

const IS_WEB = Platform.OS === 'web';

export default function DesignVitrineScreen() {
  const insets = useSafeAreaInsets();
  const top = IS_WEB ? 24 : insets.top + 12;
  const [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_700Bold,
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const [tertiaryPressed, setTertiaryPressed] = useState(false);

  if (!fontsLoaded) {
    return (
      <View style={[styles.boot, { paddingTop: top }]}>
        <ActivityIndicator color={Vitrine.primary} />
        <Text style={{ marginTop: 12, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', color: Vitrine.onSurfaceVariant }}>
          Loading Vitrine fonts…
        </Text>
      </View>
    );
  }

  const webGlass: object =
    IS_WEB
      ? {
          backgroundColor: Vitrine.glassSurface,
          backdropFilter: `blur(${Vitrine.glassBlurWebPx}px)`,
          WebkitBackdropFilter: `blur(${Vitrine.glassBlurWebPx}px)`,
        }
      : { backgroundColor: Vitrine.glassSurface };

  return (
    <ScrollView
      style={[styles.root, { paddingTop: top, paddingBottom: insets.bottom + 32 }]}
      contentContainerStyle={styles.scrollInner}
    >
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as const))}
        style={({ pressed }) => [styles.backRow, { opacity: pressed ? 0.7 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel="Close design preview"
      >
        <Ionicons name="chevron-back" size={22} color={Vitrine.primary} />
        <Text style={[styles.backText, { fontFamily: 'Manrope_600SemiBold', color: Vitrine.primary }]}>Back</Text>
      </Pressable>

      <Text
        style={[
          styles.display,
          { fontFamily: 'Newsreader_700Bold', color: Vitrine.primary, letterSpacing: -0.5 },
        ]}
      >
        The Digital Vitrine
      </Text>
      <Text style={[styles.heroSub, { fontFamily: 'Manrope_400Regular', color: Vitrine.onSurfaceVariant }]}>
        A curated, ethereal surface for culture — preview tokens only; main app unchanged.
      </Text>

      {/* Heritage indicator + headline asymmetry */}
      <View style={styles.heroRow}>
        <View style={[styles.heritageBar, { backgroundColor: Vitrine.tertiary }]} />
        <View style={{ flex: 1, paddingLeft: 16, paddingTop: 8 }}>
          <Text style={[styles.headline, { fontFamily: 'Newsreader_700Bold', color: Vitrine.onSurface }]}>
            Heritage headings sit in editorial tension.
          </Text>
        </View>
      </View>

      {/* Tonal sectioning — no hairline borders */}
      <View style={[styles.sectionLow, { backgroundColor: Vitrine.surfaceContainerLow }]}>
        <Text style={[styles.sectionLabel, { fontFamily: 'Manrope_600SemiBold', color: Vitrine.primaryContainer }]}>
          Surface layering
        </Text>
        <Text style={[styles.body, { fontFamily: 'Manrope_400Regular', color: Vitrine.onSurfaceVariant }]}>
          Base <Text style={{ fontFamily: 'Manrope_700Bold', color: Vitrine.onSurface }}>surface</Text> meets{' '}
          <Text style={{ fontFamily: 'Manrope_700Bold', color: Vitrine.onSurface }}>surface_container_low</Text> without
          a divider line — only tone.
        </Text>

        <View style={[styles.vitrineCard, { backgroundColor: Vitrine.surfaceContainerLowest, borderRadius: Vitrine.radii.card }]}>
          <Text style={[styles.cardTitle, { fontFamily: 'Manrope_700Bold', color: Vitrine.onSurface }]}>Vitrine card</Text>
          <Text style={[styles.body, { fontFamily: 'Manrope_400Regular', color: Vitrine.onSurfaceVariant, marginTop: 8 }]}>
            No visible card border — body uses on_surface_variant for long-form softness (4.5:1 target on Gallery White).
          </Text>
        </View>
      </View>

      {/* Glass strip */}
      <View style={[styles.glassStrip, webGlass as object]}>
        <Text style={{ fontFamily: 'Manrope_600SemiBold', color: Vitrine.primary }}>Glass strip</Text>
        <Text style={[styles.caption, { fontFamily: 'Manrope_400Regular', color: Vitrine.onSurfaceVariant, marginTop: 6 }]}>
          Semi-transparent surface + blur (web uses backdrop-filter).
        </Text>
      </View>

      {/* Buttons: Key style */}
      <View style={{ marginTop: Vitrine.space.sectionGap, gap: 14 }}>
        <Text style={[styles.sectionLabel, { fontFamily: 'Manrope_600SemiBold', color: Vitrine.primaryContainer }]}>
          Keys & gold leaf
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Primary gradient">
          <LinearGradient
            colors={[...Vitrine.gradientPrimary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.btnPill, { borderRadius: Vitrine.radii.pill }]}
          >
            <Text style={{ fontFamily: 'Manrope_700Bold', color: Vitrine.onPrimary, fontSize: 15 }}>Primary — gradient</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={[styles.btnSecondary, { backgroundColor: Vitrine.secondaryContainer, borderRadius: Vitrine.radii.pill }]}
          accessibilityRole="button"
          accessibilityLabel="Secondary electric ochre"
        >
          <Text style={{ fontFamily: 'Manrope_700Bold', color: Vitrine.onSecondaryContainer, fontSize: 15 }}>
            Secondary — Electric Ochre
          </Text>
        </Pressable>

        <Pressable
          onPressIn={() => setTertiaryPressed(true)}
          onPressOut={() => setTertiaryPressed(false)}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.tertiary,
              {
                fontFamily: 'Manrope_600SemiBold',
                color: Vitrine.primary,
                textDecorationLine: tertiaryPressed ? 'underline' : 'none',
              },
            ]}
          >
            Tertiary — plum label (underline on press)
          </Text>
        </Pressable>
      </View>

      {/* Ghost border sample */}
      <View
        style={[
          styles.ghostBox,
          {
            borderRadius: Vitrine.radii.md,
            borderWidth: 1,
            borderColor: vitrineGhostBorder(),
            backgroundColor: Vitrine.surfaceContainerLow,
          },
        ]}
      >
        <Text style={{ fontFamily: 'Manrope_400Regular', color: Vitrine.onSurfaceVariant, fontSize: 13 }}>
          Ghost outline (outline_variant ~15% opacity) when accessibility needs an edge.
        </Text>
      </View>

      <Text style={[styles.footer, { fontFamily: 'Manrope_400Regular', color: Vitrine.onSurfaceVariant }]}>
        Ship path: map screens incrementally to Vitrine tokens or fold selected roles into `constants/colors.ts` after sign-off.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Vitrine.background,
  },
  scrollInner: {
    paddingHorizontal: Vitrine.space.padLg,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Vitrine.background,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Vitrine.space.blockGap,
  },
  backText: {
    fontSize: 15,
  },
  display: {
    fontSize: IS_WEB ? 40 : 34,
    lineHeight: IS_WEB ? 44 : 40,
    marginBottom: 12,
  },
  heroSub: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Vitrine.space.blockGap,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Vitrine.space.sectionGap,
  },
  heritageBar: {
    width: 4,
    minHeight: 120,
    borderRadius: 2,
  },
  headline: {
    fontSize: 26,
    lineHeight: 32,
  },
  sectionLow: {
    padding: Vitrine.space.padLg,
    borderRadius: Vitrine.radii.card,
    marginBottom: Vitrine.space.blockGap,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
  },
  vitrineCard: {
    marginTop: Vitrine.space.padMd,
    padding: Vitrine.space.padLg,
    ...Platform.select({
      web: { boxShadow: Vitrine.floatShadow } as object,
      default: {
        shadowColor: '#2E0052',
        shadowOpacity: 0.08,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 4,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
  },
  glassStrip: {
    padding: Vitrine.space.padLg,
    borderRadius: Vitrine.radii.md,
    marginBottom: Vitrine.space.blockGap,
  },
  btnPill: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  tertiary: {
    fontSize: 15,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  ghostBox: {
    padding: Vitrine.space.padMd,
    marginTop: Vitrine.space.sectionGap,
    marginBottom: Vitrine.space.blockGap,
  },
  footer: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
});
