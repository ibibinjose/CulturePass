import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Easing,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Text as SvgText, G, Circle } from 'react-native-svg';
import { router } from 'expo-router';

import { useM3Colors } from '@/hooks/useM3Colors';
import { useIsDark } from '@/hooks/useColors';
import { GlassView } from '@/design-system/ui/GlassView';
import { LuxeButton } from '@/design-system/ui/LuxeButton';
import { M3Button } from '@/design-system/ui';
import { CultureTokens, FontFamily, Radius, Spacing } from '@/design-system/tokens/theme';
import { normalizeRemoteImageUri } from '@/lib/mediaUrls';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slice {
  id: string;
  label: string;
  emoji: string;
  color: string;
  category: string;
  description: string;
}

const WHEEL_SLICES: Slice[] = [
  {
    id: 'yoga',
    label: 'Yoga Class',
    emoji: '🧘',
    color: '#FF7043', // Warm Terracotta
    category: 'classes',
    description: 'Find inner calm and stretch with others in a group yoga session. Joining wellness circles helps migrants build local connections and peaceful mindsets.'
  },
  {
    id: 'movie',
    label: 'Movie Night',
    emoji: '🎬',
    color: '#9575CD', // Soft Violet
    category: 'movies',
    description: 'Enjoy a cultural screening! Cinema is a universal language, perfect for sharing narratives, stepping out of isolation, and making friends.'
  },
  {
    id: 'nature',
    label: 'Nature Walk',
    emoji: '🌳',
    color: '#4CAF50', // Leaf Green
    category: 'activities',
    description: 'Explore local landscapes and natural beauty. Group walks are fantastic for refreshing the mind, discovering local spots, and starting natural conversations.'
  },
  {
    id: 'perk',
    label: 'Claim a Perk',
    emoji: '🎟️',
    color: '#FFD54F', // Warm Gold
    category: 'offers',
    description: 'Unlock a special local offer! Exploring small businesses helps you integrate with local LGA economies while supporting multicultural venues.'
  },
  {
    id: 'art',
    label: 'Art & Museum',
    emoji: '🎭',
    color: '#E0A96D', // Heritage Tan
    category: 'art',
    description: 'Immerse yourself in local and heritage galleries. Art connects diverse backgrounds and gives newcomers a rich window into the community.'
  },
  {
    id: 'festival',
    label: 'Join Festival',
    emoji: '🎪',
    color: '#FF9800', // Deep Orange
    category: 'events',
    description: 'Vibrant music, food, and culture. Festivals are the ultimate celebration where migrants and long-term locals naturalize and share traditions.'
  },
  {
    id: 'food',
    label: 'Local Food',
    emoji: '🥘',
    color: '#E25B45', // Earthy Red
    category: 'dining',
    description: 'Savour cultural flavours near you. Food brings people together instantly. Sharing a table is the easiest way to feel at home in a new city.'
  },
  {
    id: 'tango',
    label: 'Tango Class',
    emoji: '💃',
    color: '#7E57C2', // Rich Indigo
    category: 'classes',
    description: 'Learn the steps and feel the rhythm! Dance classes require no translation and are exceptionally good for building confidence and meeting partners.'
  }
];

// Fallback recommendations when database queries are empty
const FALLBACK_RECOMMENDATIONS: Record<string, any[]> = {
  classes: [
    {
      id: 'mock-yoga',
      title: 'Yoga in the Park & Welcome Picnic',
      subtitle: 'Wellness · Centennial Park',
      description: 'Join other newcomers for a gentle, open-air yoga session followed by a casual bring-your-own picnic. A perfect low-stress way to build belonging.',
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'mock-tango',
      title: 'Community Tango & Social Dance',
      subtitle: 'Dance Class · Redfern Hub',
      description: 'No experience or partner required. A warm, beginner-friendly class designed to connect people through rhythm, conversation, and tea.',
      imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=400',
    }
  ],
  dining: [
    {
      id: 'mock-dining-1',
      title: 'Diaspora Flavours Kitchen',
      subtitle: 'Eatery · Newtown',
      description: 'A cozy local restaurant featuring heritage recipes from diaspora chefs. Every meal supports cultural culinary preservation.',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'mock-dining-2',
      title: 'Multicultural Food & Chai Festival',
      subtitle: 'Dining Hub · Marrickville',
      description: 'Gather around sharing tables. Indulge in traditional street eats while learning about local culinary histories.',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=400',
    }
  ],
  offers: [
    {
      id: 'mock-perk-1',
      title: 'Welcome Drink & Chat Mixer Code',
      subtitle: 'Civic Hotel · 100% Free Drink',
      description: 'Claim a free drink and appetizer code at the local Friday Social Hour, designed to introduce newcomers to neighborhood residents.',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'mock-perk-2',
      title: '20% Off Wellness & Sports Pass',
      subtitle: 'Soul Movement Studio',
      description: 'Enjoy a 20% discount on any group classes, from meditation to workout sessions, helping you feel at home in your body and community.',
      imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=400',
    }
  ],
  movies: [
    {
      id: 'mock-movie',
      title: 'Outdoor Film Screening: Diaspora Journeys',
      subtitle: 'Cinema · Prince Alfred Park',
      description: 'Bring a picnic blanket and watch short movies portraying stories of migration, family, and home. Popcorn and group discussions included.',
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=400',
    }
  ],
  art: [
    {
      id: 'mock-art',
      title: 'First Nations & Global Stories Exhibition',
      subtitle: 'Gallery · State Library',
      description: 'Explore the overlapping histories of First Nations cultures and diaspora journeys through visual art, letter galleries, and artifacts.',
      imageUrl: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?auto=format&fit=crop&q=80&w=400',
    }
  ],
  activities: [
    {
      id: 'mock-walk',
      title: 'Coastal Discovery Walk & Coffee',
      subtitle: 'Nature Walk · Coogee to Bondi',
      description: 'Discover the scenic coastline with friendly guides and fellow newcomers. We finish with a warm coffee to share experiences and settle in.',
      imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=400',
    }
  ],
  events: [
    {
      id: 'mock-festival',
      title: 'Intercultural Rhythm & Dance Festival',
      subtitle: 'Community Festival · Town Hall',
      description: 'A grand celebration featuring workshops, traditional drums, street vendors, and city resources helping new residents integrate.',
      imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=400',
    }
  ]
};

interface CultureWheelModalProps {
  visible: boolean;
  onClose: () => void;
  events: any[];
  dining: any[];
  perks: any[];
  classes: any[];
}

export function CultureWheelModal({
  visible,
  onClose,
  events = [],
  dining = [],
  perks = [],
  classes = [],
}: CultureWheelModalProps) {
  const colors = useM3Colors();
  const isDark = useIsDark();
  const isWeb = Platform.OS === 'web';

  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const resultFadeAnim = useRef(new Animated.Value(0)).current;

  // We track the rotation angle to calculate segments crossed for haptics
  const currentRotation = useRef(0);
  const lastTickerRef = useRef(-1);

  const drawSlicePath = (cx: number, cy: number, r: number, index: number) => {
    // Angle spacing for 8 slices. Subtract 90 to place slice 0 at the top, and offset by 22.5 to center it
    const startAngle = index * 45 - 90 - 22.5;
    const endAngle = (index + 1) * 45 - 90 - 22.5;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  };

  const handleSpin = () => {
    if (isSpinning) return;

    // Trigger haptic feedback start
    if (!isWeb) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsSpinning(true);
    setWinnerIndex(null);
    setShowResult(false);
    resultFadeAnim.setValue(0);
    scaleAnim.setValue(1);

    // Reset listener to track ticks
    spinAnim.removeAllListeners();
    spinAnim.addListener(({ value }) => {
      currentRotation.current = value;
      const normalizedDegree = Math.floor(value);
      const crossedSegment = Math.floor(normalizedDegree / 45);

      if (crossedSegment !== lastTickerRef.current) {
        lastTickerRef.current = crossedSegment;
        if (!isWeb) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    });

    // Generate a random spin: 5 to 8 full rotations + extra random angle
    const targetAngle = currentRotation.current + 1800 + Math.random() * 360;

    // Slow down cubic bezier curve for slot-machine-style tension
    Animated.timing(spinAnim, {
      toValue: targetAngle,
      duration: 4500,
      easing: Easing.bezier(0.12, 0.85, 0.22, 1),
      useNativeDriver: !isWeb,
    }).start(() => {
      setIsSpinning(false);
      
      // Calculate winner slice based on final angle
      const finalAngle = targetAngle % 360;
      const index = Math.floor(((360 - finalAngle + 22.5) % 360) / 45);
      
      setWinnerIndex(index);
      setShowResult(true);

      // Play impact feedback
      if (!isWeb) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Smooth result display transition
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.05, duration: 150, useNativeDriver: !isWeb }),
          Animated.timing(scaleAnim, { toValue: 1.0, duration: 150, useNativeDriver: !isWeb }),
        ]),
        Animated.timing(resultFadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: !isWeb,
        }),
      ]).start();
    });
  };

  const selectedSlice = useMemo(() => {
    if (winnerIndex === null) return null;
    return WHEEL_SLICES[winnerIndex];
  }, [winnerIndex]);

  // Compute recommendations for the winning category
  const recommendations = useMemo(() => {
    if (!selectedSlice) return [];

    const cat = selectedSlice.category;
    const sliceId = selectedSlice.id;

    let list: any[] = [];

    if (cat === 'classes') {
      const keyword = sliceId === 'yoga' ? 'yoga' : 'tango';
      list = classes.filter(e =>
        e.title?.toLowerCase().includes(keyword) ||
        e.description?.toLowerCase().includes(keyword) ||
        e.tags?.some((t: string) => t.toLowerCase().includes(keyword))
      );
      if (list.length === 0) list = classes;
    } else if (cat === 'dining') {
      list = dining;
    } else if (cat === 'offers') {
      list = perks;
    } else if (cat === 'movies') {
      list = events.filter(e => e.category?.toLowerCase() === 'movies' || e.title?.toLowerCase().includes('movie'));
      if (list.length === 0) list = events;
    } else if (cat === 'art') {
      list = events.filter(e => e.category?.toLowerCase() === 'art' || e.title?.toLowerCase().includes('art'));
      if (list.length === 0) list = events;
    } else if (cat === 'activities') {
      list = events.filter(e => e.title?.toLowerCase().includes('walk') || e.title?.toLowerCase().includes('nature'));
      if (list.length === 0) list = events;
    } else {
      list = events;
    }

    // Filter out strings or invalid entries
    const resolved = list.filter(i => i && typeof i !== 'string').slice(0, 2);

    // If empty, return seed mock recommendations so the wheel is always helpful
    if (resolved.length === 0) {
      return FALLBACK_RECOMMENDATIONS[sliceId] || FALLBACK_RECOMMENDATIONS[cat] || [];
    }

    return resolved;
  }, [selectedSlice, events, dining, perks, classes]);

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={() => {
        if (!isSpinning) onClose();
      }}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (!isSpinning) onClose();
          }}
          accessibilityLabel="Close wheel overlay"
        />

        <GlassView
          intensity={60}
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? 'rgba(20, 20, 25, 0.88)' : 'rgba(255, 255, 255, 0.94)',
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={{ gap: 4, flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.sheetTitle, { color: colors.onSurface }]}>CultureWheel</Text>
                <View style={[styles.tagBadge, { backgroundColor: colors.tertiaryContainer }]}>
                  <Text style={[styles.tagText, { color: colors.onTertiaryContainer }]}>GAMIFIED Discovery</Text>
                </View>
              </View>
              <Text style={[styles.sheetDesc, { color: colors.onSurfaceVariant }]}>
                New in town? Settle in, find welcoming local circles, or share your heritage.
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              disabled={isSpinning}
              hitSlop={12}
              style={[styles.closeBtn, isSpinning && { opacity: 0.3 }]}
              accessibilityLabel="Close modal"
            >
              <Ionicons name="close" size={24} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* The Spinning Wheel Section */}
            <View style={styles.wheelSection}>
              {/* Top pointer indicator */}
              <View style={styles.pointerContainer}>
                <Svg width="26" height="26" viewBox="0 0 30 30">
                  <Path d="M15 26 L4 6 L26 6 Z" fill={CultureTokens.deepSaffron} stroke="#FFFFFF" strokeWidth="2" />
                </Svg>
              </View>

              {/* Animated Wheel View */}
              <Animated.View
                style={[
                  styles.wheelWrapper,
                  {
                    transform: [{ rotate: spinInterpolation }, { scale: scaleAnim }],
                  },
                ]}
              >
                <Svg width="290" height="290" viewBox="0 0 300 300">
                  {/* Wheel outer rim */}
                  <Circle cx="150" cy="150" r="147" fill={isDark ? '#2D2D35' : '#FFFFFF'} stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} strokeWidth="6" />
                  
                  {WHEEL_SLICES.map((slice, i) => (
                    <Path
                      key={slice.id}
                      d={drawSlicePath(150, 150, 140, i)}
                      fill={slice.color}
                    />
                  ))}

                  {/* Draw labels & emojis radially */}
                  {WHEEL_SLICES.map((slice, i) => {
                    const midAngle = i * 45 - 90; // Center angle of slice
                    const textR = 92; // Radial distance
                    const tx = 150 + textR * Math.cos((midAngle * Math.PI) / 180);
                    const ty = 150 + textR * Math.sin((midAngle * Math.PI) / 180);

                    return (
                      <G key={`text-${slice.id}`} transform={`translate(${tx}, ${ty}) rotate(${midAngle + 90})`}>
                        <SvgText
                          x="0"
                          y="-8"
                          fill="#FFFFFF"
                          fontSize="15"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                        >
                          {slice.emoji}
                        </SvgText>
                        <SvgText
                          x="0"
                          y="6"
                          fill="#FFFFFF"
                          fontSize="8.5"
                          fontFamily={FontFamily.semibold}
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          letterSpacing="0.3"
                        >
                          {slice.label.split(' ')[0]}
                        </SvgText>
                      </G>
                    );
                  })}

                  {/* Center pin decoration */}
                  <Circle cx="150" cy="150" r="26" fill="#1E1E24" stroke="#FFFFFF" strokeWidth="2.5" />
                  <Circle cx="150" cy="150" r="10" fill={CultureTokens.deepSaffron} />
                </Svg>
              </Animated.View>

              {/* Spin Controller Button */}
              <View style={styles.btnRow}>
                <LuxeButton
                  onPress={handleSpin}
                  variant="filled"
                  loading={isSpinning}
                  style={{ width: 220, alignSelf: 'center', height: 50, borderRadius: 25 }}
                >
                  {isSpinning ? 'SPINNING...' : 'SPIN THE WHEEL 🎡'}
                </LuxeButton>
              </View>
            </View>

            {/* Results Reveal Area */}
            {showResult && selectedSlice && (
              <Animated.View style={{ opacity: resultFadeAnim }}>
                <GlassView
                  intensity={30}
                  style={[
                    styles.resultCard,
                    {
                      backgroundColor: isDark ? 'rgba(30, 30, 40, 0.45)' : 'rgba(245, 245, 250, 0.7)',
                      borderColor: selectedSlice.color + '4A',
                    },
                  ]}
                >
                  {/* Category Header with Icon & Emoji */}
                  <View style={styles.resultHeader}>
                    <View style={[styles.resultCircle, { backgroundColor: selectedSlice.color }]}>
                      <Text style={styles.resultEmoji}>{selectedSlice.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.categoryHeading, { color: selectedSlice.color }]}>
                        {selectedSlice.label.toUpperCase()}
                      </Text>
                      <Text style={[styles.resultSub, { color: colors.onSurface }]}>
                        {"Today's Suggested Vibe"}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.resultText, { color: colors.onSurfaceVariant }]}>
                    {selectedSlice.description}
                  </Text>

                  {/* Recommendations Header */}
                  <Text style={[styles.recommendTitle, { color: colors.onSurface, borderBottomColor: colors.outlineVariant }]}>
                    RECOMMENDED NEAR YOU:
                  </Text>

                  {/* Dynamic cards */}
                  <View style={styles.cardContainer}>
                    {recommendations.map((item, idx) => {
                      const isEvent = !!item.category || !!item.organizerId;
                      const displayTitle = item.title || item.name;
                      const displaySub = isEvent ? (item.date || 'Sydney') : item.subtitle;
                      const displayImg = item.imageUrl || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=400';
                      const route = isEvent ? `/event/${item.id}` : item.route;

                      return (
                        <Pressable
                          key={item.id || idx}
                          onPress={() => {
                            onClose();
                            if (route) {
                              router.push(route as `/${string}`);
                            }
                          }}
                          style={({ pressed }) => [
                            styles.recCard,
                            {
                              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
                              borderColor: colors.outlineVariant,
                              opacity: pressed ? 0.9 : 1,
                            },
                          ]}
                        >
                          <Image
                            source={{ uri: normalizeRemoteImageUri(displayImg) ?? undefined }}
                            style={styles.recCardImg}
                            contentFit="cover"
                          />
                          <View style={styles.recCardBody}>
                            <Text style={[styles.recCardTitle, { color: colors.onSurface }]} numberOfLines={1}>
                              {displayTitle}
                            </Text>
                            {displaySub && (
                              <Text style={[styles.recCardSub, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                                {displaySub}
                              </Text>
                            )}
                            {item.description && (
                              <Text style={[styles.recCardDesc, { color: colors.onSurfaceVariant, opacity: 0.8 }]} numberOfLines={2}>
                                {item.description}
                              </Text>
                            )}
                            <View style={styles.viewBadge}>
                              <Text style={[styles.viewBadgeText, { color: colors.primary }]}>Explore Now</Text>
                              <Ionicons name="arrow-forward" size={12} color={colors.primary} />
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={{ marginTop: Spacing.md, gap: 10 }}>
                    <M3Button
                      variant="tonal"
                      onPress={handleSpin}
                      disabled={isSpinning}
                    >
                      Spin Again
                    </M3Button>
                  </View>
                </GlassView>
              </Animated.View>
            )}
          </ScrollView>
        </GlassView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 12, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  sheet: {
    width: '100%',
    maxWidth: 500,
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  sheetTitle: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.5,
  },
  sheetDesc: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    lineHeight: 16,
    marginTop: 2,
  },
  tagBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 8.5,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.0,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  wheelSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    position: 'relative',
  },
  pointerContainer: {
    position: 'absolute',
    top: 10,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelWrapper: {
    width: 290,
    height: 290,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    ...Platform.select({
      web: {
        filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18))',
      },
    }),
  },
  btnRow: {
    marginTop: Spacing.md,
  },
  resultCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.sm,
  },
  resultCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  resultEmoji: {
    fontSize: 22,
  },
  categoryHeading: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.5,
  },
  resultSub: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    marginTop: 1,
  },
  resultText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  recommendTitle: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 6,
    marginBottom: Spacing.sm,
  },
  cardContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  recCard: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  recCardImg: {
    width: 80,
    height: '100%',
    minHeight: 80,
  },
  recCardBody: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  recCardTitle: {
    fontSize: 13.5,
    fontFamily: FontFamily.semibold,
  },
  recCardSub: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    marginTop: 1,
  },
  recCardDesc: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    marginTop: 3,
    lineHeight: 13,
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  viewBadgeText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
  },
});
