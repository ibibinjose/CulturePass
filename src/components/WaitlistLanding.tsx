import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Alert,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInDown,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  CultureTokens,
  Radius,
  FontFamily,
} from '@/design-system/tokens/theme';
import { M3Button, GlassView, M3TopAppBar, AppearanceModeToggle } from '@/design-system/ui';
import { api } from '@/lib/api';
import { useLayout } from '@/hooks/useLayout';
import { useColors, useIsDark } from '@/hooks/useColors';
import { APP_NAME } from '@/lib/app-meta';

export function WaitlistLanding() {
  const { isDesktop, contentWidth } = useLayout();
  const colors = useColors();
  const isDark = useIsDark();
  const scrollRef = useRef<ScrollView>(null);
  const emailInputRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Floating animation for background elements
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 3000 }),
        withTiming(15, { duration: 3000 })
      ),
      -1,
      true
    );
  }, [floatY]);

  const bgCircleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isSubmitted) {
        setShowPrompt(true);
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [isSubmitted]);

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.cultureX.subscribe({ email });
      setIsSubmitted(true);
      setShowPrompt(false);
    } catch (err) {
      console.error('Landing submission failed:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinNow = () => {
    setShowPrompt(false);
    // Option 1: Take to signup page
    // router.push('/(onboarding)/signup');

    // Option 2: Scroll to and focus email input on this page
    if (emailInputRef.current) {
      emailInputRef.current.focus();
      // On some platforms we might need a small delay or manual scroll
      scrollRef.current?.scrollTo({ y: 400, animated: true });
    } else {
      router.push('/(onboarding)/signup');
    }
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Join the movement at ${APP_NAME}! Belong anywhere. https://culturepass.app/landing`,
        url: 'https://culturepass.app/landing',
        title: APP_NAME,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3TopAppBar
        title={APP_NAME}
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)');
          }
        }}
        trailingStart={<AppearanceModeToggle compact />}
        actions={[
          { icon: 'share-outline', onPress: onShare, label: 'Share' },
          { icon: 'search', onPress: () => router.push('/search'), label: 'Search' },
          { icon: 'notifications-outline', onPress: () => router.push('/notifications'), label: 'Notifications' },
        ]}
        denseWeb={Platform.OS === 'web'}
        webChromeless={Platform.OS === 'web'}
      />

      {/* Dynamic Background Elements */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={[
            isDark ? '#0B0B14' : '#F8FAFC',
            isDark ? '#151525' : '#E2E8F0',
            isDark ? '#0B0B14' : '#F8FAFC'
          ]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.bgBlob, bgCircleStyle, { top: '10%', right: -100, backgroundColor: CultureTokens.violet + '15' }]} />
        <Animated.View style={[styles.bgBlob, bgCircleStyle, { bottom: '20%', left: -100, backgroundColor: CultureTokens.indigo + '15' }]} />
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && { width: Math.min(contentWidth, 1000), alignSelf: 'center' }
        ]}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <Animated.View entering={FadeIn.duration(800)} style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/culturepass-logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.heroImageContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1200' }}
              style={styles.heroImage}
              contentFit="cover"
            />
            <LinearGradient
              colors={['transparent', isDark ? '#0B0B14' : '#F8FAFC']}
              style={styles.heroImageOverlay}
            />
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.delay(200).duration(800)}
            style={[styles.heroTitle, { color: colors.text }]}
          >
            Your community needs a home.
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(400).duration(800)}
            style={[styles.heroSubtitle, { color: colors.textSecondary }]}
          >
            A gathering place for culture and connection—not just another feed.
            Join thousands of others discovering festivals, events, and belonging.
          </Animated.Text>
        </View>

        {/* Lead Gen Form */}
        <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.formCard}>
          <GlassView intensity={30} tone={isDark ? 'dark' : 'light'} style={styles.glass}>
            {!isSubmitted ? (
              <>
                <Text style={[styles.formTitle, { color: colors.text }]}>Join the movement</Text>
                <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
                  Be part of the cultural diaspora network. Get exclusive updates, priority access, and member perks.
                </Text>

                <View style={styles.inputContainer}>
                  <View style={[styles.textInputWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.borderLight }]}>
                    <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      ref={emailInputRef}
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Enter your email"
                      placeholderTextColor={colors.textTertiary}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <M3Button
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    variant="gradient"
                    style={styles.submitButton}
                  >
                    {isSubmitting ? "Joining..." : "Get Early Access"}
                  </M3Button>
                </View>
                <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
                  We speak your language. No spam, ever.
                </Text>
              </>
            ) : (
              <View style={styles.success}>
                <Animated.View entering={FadeIn.duration(500)}>
                  <Ionicons name="checkmark-circle" size={64} color={CultureTokens.teal} />
                </Animated.View>
                <Text style={[styles.successTitle, { color: colors.text }]}>You&apos;re in!</Text>
                <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                  Welcome to the community. We&apos;ll reach out with your next steps shortly.
                </Text>
                <M3Button
                  onPress={() => router.replace('/(tabs)')}
                  variant="gradient"
                >
                  Return to Discover
                </M3Button>
              </View>
            )}
          </GlassView>
        </Animated.View>

        {/* Value Propositions */}
        <View style={styles.props}>
          <PropItem
            delay={800}
            icon="language-outline"
            title="We Speak Your Language"
            desc="Built for the diaspora. Browse events and communities in your native language, ensuring you always feel at home and understood."
            imageUrl="https://images.unsplash.com/photo-1543269664-56d93c1b41a6?auto=format&fit=crop&q=80&w=800"
            isDark={isDark}
            colors={colors}
          />
          <PropItem
            delay={1000}
            icon="chatbubbles-outline"
            title="We Listen To You"
            desc="Tell us what your community needs. We curate support, festivals, and networks based on the actual needs of diaspora groups."
            imageUrl="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=400"
            isDark={isDark}
            colors={colors}
          />
          <PropItem
            delay={1200}
            icon="navigate-outline"
            title="Support Made Easy"
            desc="Navigating new systems can be hard. We make it easy, guiding you step-by-step to local services and networks."
            imageUrl="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=400"
            isDark={isDark}
            colors={colors}
          />
        </View>

        <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            © 2026 {APP_NAME}. Built with ♥️ for diaspora communities.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Popup Prompt */}
      {showPrompt && !isSubmitted && (
        <Animated.View entering={SlideInDown} style={styles.popup}>
          <GlassView intensity={60} tone={isDark ? 'dark' : 'light'} style={styles.popupGlass}>
            <View style={styles.popupContent}>
              <View style={styles.popupTextContainer}>
                <Text style={[styles.popupTitle, { color: colors.text }]}>Secure your handle</Text>
                <Text style={[styles.popupText, { color: colors.textSecondary }]}>Early members get first pick of usernames.</Text>
              </View>
              <M3Button
                onPress={handleJoinNow}
                variant="gradient"
              >
                Join Now
              </M3Button>
              <Pressable onPress={() => setShowPrompt(false)} style={styles.popupClose}>
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>
          </GlassView>
        </Animated.View>
      )}
    </View>
  );
}

function PropItem({
  icon,
  title,
  desc,
  delay,
  imageUrl,
  isDark,
  colors
}: {
  icon: any,
  title: string,
  desc: string,
  delay: number,
  imageUrl?: string,
  isDark: boolean,
  colors: any
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(600)}
      style={[
        styles.propCard,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
          borderColor: colors.borderLight
        }
      ]}
    >
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.propImage}
          contentFit="cover"
        />
      )}
      <View style={styles.propContent}>
        <View style={[styles.propIcon, { backgroundColor: CultureTokens.violet + '15', borderColor: CultureTokens.violet + '20' }]}>
          <Ionicons name={icon} size={24} color={CultureTokens.violet} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.propTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.propDesc, { color: colors.textSecondary }]}>{desc}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgBlob: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.2,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  hero: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  heroImageContainer: {
    width: '100%',
    height: 300,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 42,
    lineHeight: 52,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 800,
  },
  heroSubtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    maxWidth: 640,
  },
  formCard: {
    marginHorizontal: 24,
    marginBottom: 80,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
      }
    }),
  },
  glass: {
    padding: 32,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    gap: 16,
    ...Platform.select({
      web: {
        flexDirection: 'row',
        alignItems: 'center',
      }
    }),
  },
  textInputWrapper: {
    flex: 1,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.regular,
  },
  submitButton: {
    height: 60,
    ...Platform.select({
      web: { width: 200 }
    }),
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 13,
    textAlign: 'center',
  },
  success: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successTitle: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
    marginTop: 20,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
  },
  props: {
    paddingHorizontal: 24,
    gap: 24,
    marginBottom: 80,
    ...Platform.select({
      web: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }
    }),
  },
  propCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      web: {
        width: 310,
      }
    }),
  },
  propImage: {
    width: '100%',
    height: 150,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  propContent: {
    padding: 20,
    flexDirection: 'row',
    gap: 16,
  },
  propIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  propTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    marginBottom: 6,
  },
  propDesc: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 60,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  popup: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    zIndex: 200,
    ...Platform.select({
      web: {
        maxWidth: 480,
        alignSelf: 'center',
        left: 'auto',
        right: 'auto',
      }
    }),
  },
  popupGlass: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  popupContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  popupTextContainer: {
    flex: 1,
  },
  popupTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
  popupText: {
    fontSize: 13,
  },
  popupClose: {
    padding: 4,
  }
});
