/**
 * Nation Builders Program Page
 * 
 * Nation Builders is CulturePass.App's initiative to recognize and reward 
 * the essential people who keep Sydney running — hospitality staff, retail teams, 
 * customer service, cleaners, security, transport workers, and more.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { M3Button, M3Card } from '@/design-system/ui';
import { M3Typography, Radius } from '@/design-system/tokens/theme';
import { APP_NAME } from '@/lib/app-meta';

const NATION_BUILDERS_HEAD_TITLE = `Nation Builders Program · ${APP_NAME}`;
const NATION_BUILDERS_HEAD_DESC = 
  'Nation Builders is CulturePass.App\'s initiative to recognize and reward the essential people who keep Sydney running.';

export default function NationBuildersProgramScreen() {
  const m3Colors = useM3Colors();
  const colors = useColors();
  const { hPad } = useLayout();
  const insets = useSafeAreaInsets();

  const handleJoinPress = () => {
    // Primary CTA for businesses (acquisition) — send to host application with Nation Builder Partner intent.
    // This is the key entry point for bringing venues/businesses onto the platform.
    router.push('/hostspace/apply?intent=nation-builder' as any);
  };

  const handleStaffClaim = () => {
    // Staff / essential worker path — go to the rich program page or membership flow
    router.push('/NationBuildersProgram');
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Head>
        <title>{NATION_BUILDERS_HEAD_TITLE}</title>
        <meta name="description" content={NATION_BUILDERS_HEAD_DESC} />
        <meta property="og:title" content={NATION_BUILDERS_HEAD_TITLE} />
        <meta property="og:description" content={NATION_BUILDERS_HEAD_DESC} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      
      <ScrollView 
        contentContainerStyle={{ 
          paddingTop: insets.top + 16, 
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: hPad,
          flexGrow: 1 
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={[styles.header, { marginBottom: 24 }]}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={m3Colors.onSurface} />
          </TouchableOpacity>
          
          <View style={styles.hero}>
            <View style={[styles.badge, { backgroundColor: m3Colors.primaryContainer }]}>
              <Text style={[styles.badgeText, { color: m3Colors.onPrimaryContainer }]}>
                NATION BUILDERS
              </Text>
            </View>
            
            <Text style={[styles.heroTitle, { color: m3Colors.onSurface }]}>
              You serve Sydney. Now let Sydney serve you back.
            </Text>
            
            <Text style={[styles.heroSubtitle, { color: m3Colors.onSurfaceVariant }]}>
              The hands that keep Sydney alive deserve front-row seats to its culture.
            </Text>
          </View>
        </View>

        {/* Program Overview Card */}
        <M3Card variant="elevated" style={[styles.card, { marginBottom: 16 }]}>
          <Text style={[styles.sectionTitle, { color: m3Colors.onSurface }]}>
            Program Overview
          </Text>
          <Text style={[styles.description, { color: m3Colors.onSurfaceVariant }]}>
            Nation Builders is CulturePass.App&apos;s initiative to recognise and reward the essential people who keep Sydney running — hospitality staff, retail teams, customer service, cleaners, security, transport workers, and more.
          </Text>
          <Text style={[styles.description, { color: m3Colors.onSurfaceVariant, marginTop: 8 }]}>
            You serve our city every day. Now it&apos;s time for the city to give back.
          </Text>
        </M3Card>

        {/* What Nation Builders Receive Card */}
        <M3Card variant="elevated" style={[styles.card, { marginBottom: 16 }]}>
          <Text style={[styles.sectionTitle, { color: m3Colors.onSurface }]}>
            What Nation Builders Receive with CulturePass+
          </Text>
          <View style={styles.bulletList}>
            {[
              'CulturePass+ Membership for $69/year (50% off for staff of partner businesses)',
              '$100+ in value back every year through exclusive offers and experiences',
              'Priority and discounted tickets to festivals, performances, workshops, and community gatherings',
              'Exclusive access to off-peak cultural events (mid-week, daytime, quieter sessions)',
              'Nation Builder badge on their profile',
              'Quarterly cultural challenges + recognition stories',
              'Birthday Gifts to claim every year',
              'Annual Nation Builders celebration event'
            ].map((item, index) => (
              <View key={index} style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={16} color={m3Colors.primary} />
                <Text style={[styles.bulletText, { color: m3Colors.onSurfaceVariant, marginLeft: 8 }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[styles.note, { color: m3Colors.onSurfaceVariant, marginTop: 12 }]}>
            Less than $1.35 a week for meaningful access to culture that fits around your roster.
          </Text>
        </M3Card>

        {/* What Partner Businesses Receive Card */}
        <M3Card variant="elevated" style={[styles.card, { marginBottom: 16 }]}>
          <Text style={[styles.sectionTitle, { color: m3Colors.onSurface }]}>
            What Partner Businesses Receive
          </Text>
          <View style={styles.bulletList}>
            {[
              'Free listing on CulturePass',
              'Staff CulturePass+ perk as a powerful retention and recruitment tool',
              'Ability to fill quiet hours with engaged CulturePass members',
              'Increased visibility within Sydney\'s multicultural communities',
              'Positive brand association with social impact'
            ].map((item, index) => (
              <View key={index} style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={16} color={m3Colors.primary} />
                <Text style={[styles.bulletText, { color: m3Colors.onSurfaceVariant, marginLeft: 8 }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </M3Card>

        {/* How to Join Card */}
        <M3Card variant="elevated" style={[styles.card, { marginBottom: 16 }]}>
          <Text style={[styles.sectionTitle, { color: m3Colors.onSurface }]}>
            How to Join
          </Text>
          <Text style={[styles.description, { color: m3Colors.onSurfaceVariant }]}>
            <Text style={{ fontWeight: '600' }}>For Businesses &amp; Venues:</Text> Apply to become a Nation Builder Partner. Your staff will get 50% off CulturePass+ and you&apos;ll get powerful retention + visibility tools.
          </Text>
          <Text style={[styles.description, { color: m3Colors.onSurfaceVariant, marginTop: 12 }]}>
            <Text style={{ fontWeight: '600' }}>For Staff &amp; Essential Workers:</Text> Once your workplace is a partner, use the code they provide (or the claim flow) to unlock your 50% CulturePass+ discount + Nation Builder badge.
          </Text>
        </M3Card>

        {/* CTA Section — Dual audience for acquisition + conversion */}
        <View style={{ paddingHorizontal: hPad, marginBottom: 24, gap: 12 }}>
          <M3Button 
            variant="filled" 
            onPress={handleJoinPress}
            style={styles.ctaButton}
          >
            I'm a Business / Venue Owner — Become a Partner
          </M3Button>

          <M3Button 
            variant="outlined" 
            onPress={handleStaffClaim}
            style={styles.ctaButton}
          >
            I'm Staff / Essential Worker — Claim My 50% Off
          </M3Button>
          
          <Text style={[styles.hashtagText, { color: m3Colors.onSurfaceVariant, textAlign: 'center', marginTop: 16 }]}>
            #NationBuilders #CulturePass #CulturePassPlus #ServeAndBelong #SydneyCulture #NationBuildersSydney #MulticulturalSydney
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
  },
  hero: {
    alignItems: 'center',
    maxWidth: 500,
    alignSelf: 'center',
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    marginBottom: 16,
  },
  badgeText: {
    ...M3Typography.labelSmall,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    ...M3Typography.headlineMedium,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  heroSubtitle: {
    ...M3Typography.titleLarge,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    marginHorizontal: 0,
    borderRadius: Radius.lg,
    padding: 16,
  },
  sectionTitle: {
    ...M3Typography.headlineSmall,
    marginBottom: 12,
  },
  description: {
    ...M3Typography.bodyMedium,
    lineHeight: 20,
  },
  bulletList: {
    gap: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletText: {
    ...M3Typography.bodyMedium,
    flex: 1,
    lineHeight: 20,
  },
  note: {
    ...M3Typography.bodySmall,
    fontStyle: 'italic',
  },
  ctaButton: {
    width: '100%',
  },
  hashtagText: {
    ...M3Typography.bodySmall,
  },
});