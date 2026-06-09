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
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Text as SvgText, G, Circle } from 'react-native-svg';
import { router } from 'expo-router';

import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useIsDark } from '@/hooks/useColors';
import { GlassView } from '@/design-system/ui/GlassView';
import { LuxeButton } from '@/design-system/ui/LuxeButton';
import { M3Button } from '@/design-system/ui';
import { CULTURE_WHEEL_MODAL, CULTURE_WHEEL_SLICE_COLORS } from '@/design-system/tokens/cultureWheelModalTokens';
import { CultureTokens, FontFamily, Radius, Spacing } from '@/design-system/tokens/theme';
import { normalizeRemoteImageUri } from '@/lib/mediaUrls';
import { getCommunityProfilePathId } from '@/lib/community';
import { useFeaturedCities } from '@/hooks/useFeaturedCities';

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
    id: 'hubs',
    label: 'Hubs',
    emoji: '🏛️',
    color: CULTURE_WHEEL_SLICE_COLORS.hubs,
    category: 'hubs',
    description: 'Connect with community hubs and cultural associations near you.'
  },
  {
    id: 'events',
    label: 'Events',
    emoji: '🎪',
    color: CULTURE_WHEEL_SLICE_COLORS.events,
    category: 'events',
    description: 'Celebrate culture, music, and heritage with upcoming local events.'
  },
  {
    id: 'art',
    label: 'Art',
    emoji: '🎭',
    color: CULTURE_WHEEL_SLICE_COLORS.art,
    category: 'art',
    description: 'Explore gallery openings, heritage exhibitions, and visual art.'
  },
  {
    id: 'movies',
    label: 'Movies',
    emoji: '🎬',
    color: CULTURE_WHEEL_SLICE_COLORS.movies,
    category: 'movies',
    description: 'Enjoy cinema screenings and heritage films.'
  },
  {
    id: 'dining',
    label: 'Dining',
    emoji: '🥘',
    color: CULTURE_WHEEL_SLICE_COLORS.dining,
    category: 'dining',
    description: 'Savour authentic cultural cuisines and dining spaces.'
  },
  {
    id: 'activities',
    label: 'Activities',
    emoji: '🌳',
    color: CULTURE_WHEEL_SLICE_COLORS.activities,
    category: 'activities',
    description: 'Participate in group outdoor activities, walks, and local tours.'
  },
  {
    id: 'classes',
    label: 'Classes & Gym',
    emoji: '🧘',
    color: CULTURE_WHEEL_SLICE_COLORS.classes,
    category: 'classes',
    description: 'Learn new skills, tango, yoga, and wellness sessions.'
  },
  {
    id: 'travel',
    label: 'Travel',
    emoji: '✈️',
    color: CULTURE_WHEEL_SLICE_COLORS.travel,
    category: 'travel',
    description: 'Explore featured cultural travel destinations and weekend trips.'
  },
  {
    id: 'shopping',
    label: 'Shopping',
    emoji: '🛍️',
    color: CULTURE_WHEEL_SLICE_COLORS.shopping,
    category: 'shopping',
    description: 'Support local businesses selling cultural goods and fashion.'
  },
  {
    id: 'offers',
    label: 'Offers',
    emoji: '🎟️',
    color: CULTURE_WHEEL_SLICE_COLORS.offers,
    category: 'offers',
    description: 'Claim exclusive local deals, discounts, and member perks.'
  },
  {
    id: 'directory',
    label: 'Directory',
    emoji: '📇',
    color: CULTURE_WHEEL_SLICE_COLORS.directory,
    category: 'directory',
    description: 'Browse the full local directory of cultural business, associations, and services.'
  },
  {
    id: 'indigenous',
    label: 'Indigenous',
    emoji: '🍂',
    color: CULTURE_WHEEL_SLICE_COLORS.indigenous,
    category: 'indigenous',
    description: 'Acknowledge traditional lands and support First Nations organisations.'
  }
];

// Fallback recommendations when database queries are empty
const FALLBACK_RECOMMENDATIONS: Record<string, any[]> = {
  hubs: [
    {
      id: 'mock-hub-1',
      name: 'Multicultural Community Hub',
      subtitle: 'Association · Sydney CBD',
      description: 'A welcoming space hosting weekly coffee meetups, language exchanges, and settlement assistance for new arrivals.',
      imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'mock-hub-2',
      name: 'Global Diaspora Circle',
      subtitle: 'Club · Parramatta',
      description: 'Connect with local diaspora members to share stories, food, and professional networking opportunities.',
      imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=400',
    }
  ],
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
  ],
  travel: [
    {
      id: 'mock-travel-1',
      name: 'Melbourne',
      countryName: 'Australia',
      countryEmoji: '🇦🇺',
      imageUrl: 'https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'mock-travel-2',
      name: 'Auckland',
      countryName: 'New Zealand',
      countryEmoji: '🇳🇿',
      imageUrl: 'https://images.unsplash.com/photo-1507699622108-4be3aac695ad?auto=format&fit=crop&q=80&w=400',
    }
  ],
  shopping: [
    {
      id: 'mock-shop-1',
      name: 'Heritage Spices & Handicrafts',
      subtitle: 'Specialty Store · Surry Hills',
      description: 'Authentic imported spices, artisanal kitchenware, and handmade textiles from around the world.',
      imageUrl: 'https://images.unsplash.com/photo-1488459718432-01055e67e1f5?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'mock-shop-2',
      name: 'Global Threads Apparel',
      subtitle: 'Boutique · Fitzroy',
      description: 'Vibrant apparel celebrating diverse cultures and traditional weaving techniques made modern.',
      imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=400',
    }
  ],
  directory: [
    {
      id: 'mock-dir-1',
      name: 'Local Business Directory',
      subtitle: 'Directory Services',
      description: 'Access the complete business registry to find verified cultural grocers, tax agents, translators, and legal assistance.',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400',
    }
  ],
  indigenous: [
    {
      id: 'mock-indig-1',
      name: 'First Nations Cultural Centre',
      subtitle: 'Organisation · Redfern',
      description: 'Dedicated to preserving Aboriginal history, hosting art walks, community programs, and local smoke ceremonies.',
      imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=400',
    }
  ]
};

interface CultureWheelModalProps {
  visible: boolean;
  onClose: () => void;
  events?: any[];
  dining?: any[];
  perks?: any[];
  classes?: any[];
  hubs?: any[];
  activities?: any[];
  shopping?: any[];
  indigenousOrganisations?: any[];
  land?: any;
}

export function CultureWheelModal({
  visible,
  onClose,
  events = [],
  dining = [],
  perks = [],
  classes = [],
  hubs = [],
  activities = [],
  shopping = [],
  indigenousOrganisations = [],
  land,
}: CultureWheelModalProps) {
  const colors = useM3Colors();
  const isDark = useIsDark();
  const isWeb = Platform.OS === 'web';
  const { width: windowWidth, isDesktop } = useLayout();

  // Responsive wheel size: larger on desktop (380px), scaled to screen width on mobile (max 350px)
  const wheelSize = isDesktop ? 380 : Math.min(350, windowWidth - 48);

  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const resultFadeAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for the spin button to attract attention when idle
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (visible && !isSpinning) {
      pulseAnim.setValue(1);
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [visible, isSpinning, pulseAnim]);

  // We track the rotation angle to calculate segments crossed for haptics
  const currentRotation = useRef(0);
  const lastTickerRef = useRef(-1);

  // Fetch featured cities directly for Travel category recommendations
  const { cities: featuredCities } = useFeaturedCities();

  const drawSlicePath = (cx: number, cy: number, r: number, index: number) => {
    const sliceAngle = 360 / WHEEL_SLICES.length;
    // Offset by sliceAngle / 2 to center the slice at the top pointer
    const startAngle = index * sliceAngle - 90 - (sliceAngle / 2);
    const endAngle = (index + 1) * sliceAngle - 90 - (sliceAngle / 2);

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

    const sliceAngle = 360 / WHEEL_SLICES.length;

    // Reset listener to track ticks
    spinAnim.removeAllListeners();
    spinAnim.addListener(({ value }) => {
      currentRotation.current = value;
      const normalizedDegree = Math.floor(value);
      const crossedSegment = Math.floor(normalizedDegree / sliceAngle);

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
      const index = Math.floor(((360 - finalAngle + (sliceAngle / 2)) % 360) / sliceAngle);
      
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

  // Compute recommendations for the winning category using real backend queries
  const recommendations = useMemo(() => {
    if (!selectedSlice) return [];

    const cat = selectedSlice.category;
    const sliceId = selectedSlice.id;

    let list: any[] = [];

    if (cat === 'classes') {
      list = classes;
    } else if (cat === 'dining') {
      list = dining;
    } else if (cat === 'offers') {
      list = perks;
    } else if (cat === 'hubs') {
      list = hubs;
    } else if (cat === 'activities') {
      list = activities;
    } else if (cat === 'shopping') {
      list = shopping;
    } else if (cat === 'indigenous') {
      list = indigenousOrganisations;
    } else if (cat === 'travel') {
      list = featuredCities;
    } else if (cat === 'movies') {
      list = events.filter(e => e.category?.toLowerCase() === 'movies' || e.title?.toLowerCase().includes('movie'));
      if (list.length === 0) list = events;
    } else if (cat === 'art') {
      list = events.filter(e => e.category?.toLowerCase() === 'art' || e.title?.toLowerCase().includes('art') || e.title?.toLowerCase().includes('museum') || e.title?.toLowerCase().includes('gallery') || e.title?.toLowerCase().includes('exhibition'));
      if (list.length === 0) list = events;
    } else if (cat === 'directory') {
      list = [...shopping, ...dining];
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
  }, [selectedSlice, events, dining, perks, classes, hubs, activities, shopping, indigenousOrganisations, featuredCities]);

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
              backgroundColor: isDark ? CULTURE_WHEEL_MODAL.sheetFillDark : CULTURE_WHEEL_MODAL.sheetFillLight,
              borderColor: colors.outlineVariant,
              maxWidth: isDesktop ? 560 : 500,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerCopy}>
              <View style={styles.headerTitleRow}>
                <Text style={[styles.sheetTitle, { color: colors.onSurface }]} numberOfLines={1}>
                  CultureWheel
                </Text>
                <View style={[styles.tagBadge, { backgroundColor: colors.tertiaryContainer }]}>
                  <Text style={[styles.tagText, { color: colors.onTertiaryContainer }]} numberOfLines={1}>
                    GAMIFIED Discovery
                  </Text>
                </View>
              </View>
              <Text style={[styles.sheetDesc, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
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
                  <Path
                    d="M15 26 L4 6 L26 6 Z"
                    fill={CultureTokens.deepSaffron}
                    stroke={CULTURE_WHEEL_MODAL.pointerStroke}
                    strokeWidth="2"
                  />
                </Svg>
              </View>

              {/* Animated Wheel View */}
              <Animated.View
                style={[
                  styles.wheelWrapper,
                  {
                    width: wheelSize,
                    height: wheelSize,
                    transform: [{ rotate: spinInterpolation }, { scale: scaleAnim }],
                  },
                ]}
              >
                <Svg width={wheelSize} height={wheelSize} viewBox="0 0 300 300">
                  {/* Wheel outer rim */}
                  <Circle
                    cx="150"
                    cy="150"
                    r="147"
                    fill={isDark ? CULTURE_WHEEL_MODAL.rimFillDark : CULTURE_WHEEL_MODAL.rimFillLight}
                    stroke={isDark ? CULTURE_WHEEL_MODAL.rimStrokeDark : CULTURE_WHEEL_MODAL.rimStrokeLight}
                    strokeWidth="6"
                  />
                  
                  {WHEEL_SLICES.map((slice, i) => (
                    <Path
                      key={slice.id}
                      d={drawSlicePath(150, 150, 140, i)}
                      fill={slice.color}
                    />
                  ))}

                  {/* Draw labels & emojis radially */}
                  {WHEEL_SLICES.map((slice, i) => {
                    const sliceAngle = 360 / WHEEL_SLICES.length;
                    const midAngle = i * sliceAngle - 90; // Center angle of slice
                    const textR = 108; // Radial distance
                    const tx = 150 + textR * Math.cos((midAngle * Math.PI) / 180);
                    const ty = 150 + textR * Math.sin((midAngle * Math.PI) / 180);

                    return (
                      <G key={`text-${slice.id}`} transform={`translate(${tx}, ${ty}) rotate(${midAngle + 90})`}>
                        <SvgText
                          x="0"
                          y="-8"
                          fill={CULTURE_WHEEL_MODAL.inkOnSlice}
                          fontSize="13"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                        >
                          {slice.emoji}
                        </SvgText>
                        <SvgText
                          x="0"
                          y="6"
                          fill={CULTURE_WHEEL_MODAL.inkOnSlice}
                          fontSize="7.5"
                          fontFamily={FontFamily.semibold}
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          letterSpacing="0.2"
                        >
                          {slice.label.split(' ')[0]}
                        </SvgText>
                      </G>
                    );
                  })}

                  {/* Center pin decoration */}
                  <Circle
                    cx="150"
                    cy="150"
                    r="26"
                    fill={CULTURE_WHEEL_MODAL.centerPinFill}
                    stroke={CULTURE_WHEEL_MODAL.centerPinStroke}
                    strokeWidth="2.5"
                  />
                  <Circle cx="150" cy="150" r="10" fill={CultureTokens.deepSaffron} />
                </Svg>
              </Animated.View>

              {/* Spin Controller Button */}
              <Animated.View style={[styles.btnRow, { transform: [{ scale: pulseAnim }] }]}>
                <LuxeButton
                  onPress={handleSpin}
                  variant="filled"
                  loading={isSpinning}
                  style={styles.spinButton}
                  gradientColors={[...CULTURE_WHEEL_MODAL.spinGradient]}
                >
                  {isSpinning ? 'SPINNING...' : 'SPIN THE WHEEL 🎡'}
                </LuxeButton>
              </Animated.View>
            </View>

            {/* Results Reveal Area */}
            {showResult && selectedSlice && (
              <Animated.View style={{ opacity: resultFadeAnim }}>
                <GlassView
                  intensity={30}
                  style={[
                    styles.resultCard,
                    {
                      backgroundColor: isDark ? CULTURE_WHEEL_MODAL.resultCardDark : CULTURE_WHEEL_MODAL.resultCardLight,
                      borderColor: selectedSlice.color + '4A',
                    },
                  ]}
                >
                  {/* Category Header with Icon & Emoji */}
                  <View style={styles.resultHeader}>
                    <View style={[styles.resultCircle, { backgroundColor: selectedSlice.color }]}>
                      <Text style={styles.resultEmoji} numberOfLines={1}>
                        {selectedSlice.emoji}
                      </Text>
                    </View>
                    <View style={styles.resultHeaderCopy}>
                      <Text style={[styles.categoryHeading, { color: selectedSlice.color }]} numberOfLines={1}>
                        {selectedSlice.label.toUpperCase()}
                      </Text>
                      <Text style={[styles.resultSub, { color: colors.onSurface }]} numberOfLines={1}>
                        {"Today's Suggested Vibe"}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.resultText, { color: colors.onSurfaceVariant }]} numberOfLines={3}>
                    {selectedSlice.description}
                  </Text>

                  {/* Recommendations Header */}
                  <Text
                    style={[styles.recommendTitle, { color: colors.onSurface, borderBottomColor: colors.outlineVariant }]}
                    numberOfLines={1}
                  >
                    RECOMMENDED NEAR YOU:
                  </Text>

                  {/* Dynamic cards */}
                  <View style={styles.cardContainer}>
                    {recommendations.map((item, idx) => {
                      const displayTitle = item.title || item.name;
                      
                      // Resolve display image
                      let fallbackImg = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=400';
                      const cat = selectedSlice.category;
                      if (cat === 'indigenous') {
                        fallbackImg = 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=400';
                      } else if (cat === 'travel') {
                        fallbackImg = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=400';
                      } else if (cat === 'hubs') {
                        fallbackImg = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=400';
                      }
                      const displayImg = item.imageUrl || fallbackImg;

                      // Resolve subtitle and route based on category
                      let displaySub = item.subtitle || '';
                      let route: any = '';

                      if (cat === 'events' || cat === 'art' || cat === 'movies' || cat === 'classes') {
                        displaySub = item.date || item.subtitle || 'Upcoming Event';
                        route = `/event/${item.id}`;
                      } else if (cat === 'activities') {
                        displaySub = item.subtitle || item.category || 'Local Activity';
                        route = `/a/${item.id}`;
                      } else if (cat === 'hubs') {
                        displaySub = item.subtitle || (item.memberCount || item.membersCount ? `${(item.memberCount || item.membersCount).toLocaleString()} members` : 'Community Hub');
                        const pathId = getCommunityProfilePathId(item);
                        route = {
                          pathname: '/c/[id]',
                          params: { id: pathId }
                        };
                      } else if (cat === 'dining') {
                        displaySub = item.subtitle || item.cuisine || 'Cultural Dining';
                        route = `/business/${item.id}`;
                      } else if (cat === 'shopping') {
                        displaySub = item.subtitle || item.category || 'Specialty Store';
                        route = `/CultureMarket/${item.id}`;
                      } else if (cat === 'offers') {
                        displaySub = item.subtitle || item.discountCode || 'Exclusive Offer';
                        route = `/perks/${item.id}`;
                      } else if (cat === 'travel') {
                        displaySub = item.countryName ? `${item.countryEmoji || ''} ${item.countryName}` : 'Featured City';
                        route = {
                          pathname: '/city/[name]',
                          params: { name: item.name, country: item.countryName }
                        };
                      } else if (cat === 'directory') {
                        displaySub = item.subtitle || 'Local Directory';
                        route = item.id ? `/CultureMarket/${item.id}` : '/(tabs)/directory';
                      } else if (cat === 'indigenous') {
                        displaySub = item.nationOrPeople || item.city || 'First Nations';
                        route = '/browse/All';
                      }

                      return (
                        <Pressable
                          key={item.id || idx}
                          onPress={() => {
                            onClose();
                            if (route) {
                              router.push(route as any);
                            }
                          }}
                          style={({ pressed }) => [
                            styles.recCard,
                            {
                              backgroundColor: isDark ? CULTURE_WHEEL_MODAL.recCardDark : CULTURE_WHEEL_MODAL.recCardLight,
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
                              <Text style={[styles.viewBadgeText, { color: colors.primary }]} numberOfLines={1}>
                                Explore Now
                              </Text>
                              <Ionicons name="arrow-forward" size={12} color={colors.primary} />
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.spinAgainRow}>
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
    backgroundColor: CULTURE_WHEEL_MODAL.backdrop,
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
    shadowColor: CULTURE_WHEEL_MODAL.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
    maxHeight: '90%',
  },
  headerCopy: { gap: 4, flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spinButton: {
    width: 240,
    alignSelf: 'center',
    height: 52,
    borderRadius: 26,
    ...Platform.select({
      web: {
        boxShadow: `0 8px 24px ${CULTURE_WHEEL_MODAL.spinButtonShadow}`,
      },
    }),
  },
  resultHeaderCopy: { flex: 1 },
  spinAgainRow: { marginTop: Spacing.md, gap: 10 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CULTURE_WHEEL_MODAL.sheetHeaderDivider,
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
    width: 330,
    height: 330,
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
    shadowColor: CULTURE_WHEEL_MODAL.shadow,
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
