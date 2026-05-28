import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, TextStyles, Spacing, Radius } from '@/design-system/tokens/theme';
import { M3TopAppBar } from '@/design-system/ui';
import { goBackOrReplace } from '@/lib/navigation';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';
const MAX_CONTENT_WIDTH = 800;
const SIDEBAR_WIDTH = 260;

export interface StaticSection {
  title: string;
  body: string;
}

interface Props {
  title: string;
  lastUpdated?: string;
  intro?: string;
  sections: StaticSection[];
  heroIcon?: keyof typeof Ionicons.glyphMap;
  heroColor?: string;
  badges?: { label: string; icon: string; color: string }[];
  footerContent?: React.ReactNode;
  onBack?: () => void;
  topBarDense?: boolean;
  children?: React.ReactNode;
}

export function StaticPageLayout({
  title,
  lastUpdated,
  intro,
  sections,
  heroIcon,
  heroColor = CultureTokens.indigo,
  badges,
  footerContent,
  onBack,
  topBarDense = true,
  children,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const sectionLayouts = useRef<Record<number, number>>({});
  const [activeSection, setActiveSection] = useState(0);

  const handleScrollToSection = (index: number) => {
    const y = sectionLayouts.current[index] || 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 40), animated: true });
    setActiveSection(index);
  };

  const renderSidebar = () => {
    if (!IS_WEB || WINDOW_WIDTH < 1000) return null;

    return (
      <View style={[styles.sidebar, { borderRightColor: colors.borderLight }]}>
        <Text style={[styles.sidebarTitle, { color: colors.textTertiary }]}>Contents</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {sections.map((sec, idx) => (
            <Pressable
              key={idx}
              onPress={() => handleScrollToSection(idx)}
              style={({ pressed }) => [
                styles.tocItem,
                activeSection === idx && { backgroundColor: colors.surfaceVariant },
                pressed && { opacity: 0.7 }
              ]}
            >
              <Text
                style={[
                  styles.tocText,
                  { color: activeSection === idx ? heroColor : colors.textSecondary },
                  activeSection === idx && styles.tocTextActive,
                ]}
                numberOfLines={1}
              >
                {sec.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3TopAppBar
        title={title}
        onBack={onBack || (() => goBackOrReplace('/settings'))}
        denseWeb={topBarDense}
        webChromeless
      />

      <View style={styles.mainWrapper}>
        {renderSidebar()}

        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: 80 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={IS_WEB}
          scrollEventThrottle={16}
        >
          <Animated.View entering={FadeIn.duration(600)}>
            <LinearGradient
              colors={gradients.culturepassBrand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.hero,
                IS_WEB && { marginTop: Spacing.lg, borderRadius: Radius.xl, marginHorizontal: Spacing.md }
              ]}
            >
              <View style={styles.heroContent}>
                {heroIcon && (
                  <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name={heroIcon} size={32} color="#fff" />
                  </View>
                )}
                <Text style={styles.heroTitle}>{title}</Text>
                {lastUpdated && (
                  <View style={styles.lastUpdatedBadge}>
                    <Text style={[styles.lastUpdatedText, { color: heroColor }]}>
                      Last updated: {lastUpdated}
                    </Text>
                  </View>
                )}
                {intro && <Text style={styles.introText}>{intro}</Text>}
              </View>
            </LinearGradient>
          </Animated.View>

          <View style={styles.body}>
            {badges && badges.length > 0 && (
              <View style={styles.badgeRow}>
                {badges.map((b, i) => (
                  <View
                    key={i}
                    style={[
                      styles.badge,
                      { backgroundColor: b.color + '12', borderColor: b.color + '25' },
                    ]}
                  >
                    <Ionicons name={b.icon as any} size={14} color={b.color} />
                    <Text style={[styles.badgeText, { color: b.color }]}>{b.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {children}

            {sections.map((sec, i) => (
              <View
                key={i}
                onLayout={(e) => {
                  sectionLayouts.current[i] = e.nativeEvent.layout.y + (IS_WEB ? 200 : 300);
                }}
                style={styles.section}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{sec.title}</Text>
                <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                  {sec.body}
                </Text>
              </View>
            ))}

            {footerContent && (
              <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
                {footerContent}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainWrapper: { 
    flex: 1, 
    flexDirection: 'row', 
    alignSelf: 'center', 
    width: '100%', 
    maxWidth: 1200 
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
    borderRightWidth: 1,
    height: '100%',
    display: IS_WEB ? 'flex' : 'none',
  },
  sidebarTitle: { 
    ...TextStyles.caption, 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    letterSpacing: 1.2, 
    marginBottom: Spacing.md, 
    paddingLeft: Spacing.sm 
  },
  tocItem: { 
    paddingVertical: 10, 
    paddingHorizontal: 12, 
    borderRadius: Radius.md, 
    marginBottom: 2 
  },
  tocText: { 
    ...TextStyles.caption, 
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? 'Inter, sans-serif' : undefined 
  },
  tocTextActive: { 
    fontWeight: '700' 
  },
  scrollView: { flex: 1 },
  contentContainer: { 
    alignSelf: 'center', 
    width: '100%', 
    maxWidth: MAX_CONTENT_WIDTH 
  },
  hero: {
    padding: Spacing.xl,
    paddingTop: IS_WEB ? Spacing.xl * 1.5 : Spacing.xl,
    overflow: 'hidden',
  },
  heroContent: { alignItems: 'center' },
  iconWrap: { 
    width: 64, 
    height: 64, 
    borderRadius: Radius.lg, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: Spacing.lg 
  },
  heroTitle: { 
    ...TextStyles.title1, 
    color: '#fff', 
    textAlign: 'center', 
    marginBottom: Spacing.xs 
  },
  lastUpdatedBadge: {
    backgroundColor: '#fff', 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    borderRadius: Radius.full,
    marginBottom: Spacing.lg,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
      default: { elevation: 3 }
    })
  },
  lastUpdatedText: { 
    ...TextStyles.caption, 
    fontWeight: '700' 
  },
  introText: { 
    ...TextStyles.body, 
    color: 'rgba(255,255,255,0.92)', 
    textAlign: 'center', 
    lineHeight: 26, 
    maxWidth: 640 
  },
  body: { 
    padding: Spacing.lg,
    paddingTop: Spacing.xl 
  },
  badgeRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: Spacing.sm, 
    marginBottom: Spacing.xl, 
    justifyContent: 'center' 
  },
  badge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: Radius.full, 
    borderWidth: 1 
  },
  badgeText: { 
    ...TextStyles.caption, 
    fontWeight: '700', 
    fontSize: 12 
  },
  section: { 
    marginBottom: Spacing.xl * 1.5 
  },
  sectionTitle: { 
    ...TextStyles.headline, 
    marginBottom: Spacing.sm,
    letterSpacing: 0.2
  },
  sectionBody: { 
    ...TextStyles.body, 
    lineHeight: 28 
  },
  footer: { 
    marginTop: Spacing.xl, 
    paddingTop: Spacing.xl * 1.5, 
    alignItems: 'center', 
    gap: Spacing.sm, 
    borderTopWidth: StyleSheet.hairlineWidth 
  },
});
