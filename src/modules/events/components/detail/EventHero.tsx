import React from 'react';
import { View, StyleSheet, Text, Pressable, Platform } from 'react-native';
import { CultureImage } from '@/design-system/ui/CultureImage';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { EventData } from '@/shared/schema';
import { FontFamily, CultureTokens, M3Typography } from '@/design-system/tokens/theme';
import { useM3Colors } from '@/hooks/useM3Colors';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

// Safety check for layout animations which can be undefined in some environments/versions
const SafeFadeInDown = FadeInDown ?? FadeIn;

interface EventHeroProps {
  event: EventData;
  heroDisplayUri?: string;
  saved: boolean;
  isDesktop: boolean;
  topInset: number;
  handleBack: () => void;
  handleShare: () => void;
  handleSave: () => void;
}

function HeroIconButton({ icon, onPress, accessibilityLabel, color }: { icon: keyof typeof Ionicons.glyphMap, onPress: () => void, accessibilityLabel: string, color?: string }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.heroIconBtn,
                { backgroundColor: 'rgba(0,0,0,0.3)' },
                pressed && { backgroundColor: 'rgba(0,0,0,0.5)', transform: [{ scale: 0.95 }] }
            ]}
        >
            <Ionicons name={icon} size={22} color={color || '#FFFFFF'} />
        </Pressable>
    );
}

export function EventHero({
  event,
  heroDisplayUri,
  isDesktop,
  topInset,
  handleBack,
  handleShare,
  handleSave,
  saved,
}: EventHeroProps) {
  const height = isDesktop ? 540 : 380;
  const m3Colors = useM3Colors();

  return (
    <View style={[styles.container, { height }]}>
      {heroDisplayUri ? (
        <Animated.View entering={FadeIn.duration(600)} style={StyleSheet.absoluteFill}>
          <CultureImage
            uri={heroDisplayUri}
            style={StyleSheet.absoluteFill}
            transition={300}
          />
        </Animated.View>
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0C0A09' }]}>
            <LinearGradient colors={['#1C1917', '#0C0A09']} style={StyleSheet.absoluteFill} />
        </View>
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.8)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topControls, { top: topInset + 12 }]}>
        <HeroIconButton
          icon="arrow-back"
          onPress={handleBack}
          accessibilityLabel="Go back"
        />

        <View style={styles.rightControls}>
          <HeroIconButton
            icon="share-outline"
            onPress={handleShare}
            accessibilityLabel="Share event"
          />

          <HeroIconButton
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            onPress={handleSave}
            accessibilityLabel={saved ? 'Unsave event' : 'Save event'}
            color={saved ? CultureTokens.gold : "#FFFFFF"}
          />
        </View>
      </View>

      <View style={styles.heroFooter}>
         <Animated.View entering={SafeFadeInDown ? SafeFadeInDown.delay(200).duration(400) : undefined}>
            <View style={[styles.categoryBadge, { backgroundColor: m3Colors.tertiaryContainer, borderColor: 'transparent' }]}>
                <Text style={[styles.categoryText, { color: m3Colors.onTertiaryContainer }]}>{event.category?.toUpperCase() || 'EVENT'}</Text>
            </View>
         </Animated.View>
         <Text style={[styles.title, M3Typography.headlineLarge]} numberOfLines={2}>{event.title}</Text>
         <View style={styles.metaRow}>
            <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={[styles.metaText, M3Typography.labelLarge]}>{event.date}</Text>
            </View>
            <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={[styles.metaText, M3Typography.labelLarge]}>{event.city}</Text>
            </View>
         </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  topControls: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  heroIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
        },
        android: {
            elevation: 4,
        }
    })
  },
  rightControls: {
    flexDirection: 'row',
    gap: 12,
  },
  heroFooter: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    gap: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 0,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },
  title: {
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: 'rgba(255,255,255,0.9)',
  },
});
