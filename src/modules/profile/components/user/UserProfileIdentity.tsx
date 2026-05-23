import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { User } from '@shared/schema';
import { CP } from './profileUtils';

type Props = {
  user: User;
  displayName: string;
  memberSince: string;
  tierConf: {
    color: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  };
};

export default function UserProfileIdentity({
  user,
  displayName,
  memberSince,
  tierConf,
}: Props) {
  const cpid = user.culturePassId ?? `CPID-${user.id}`;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>CulturePass ID</Text>
      </View>

      <LinearGradient
        colors={[CP.dark, '#1a0533', CP.darkMid]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.cpidCard}
      >
        <LinearGradient
          colors={['transparent', CP.teal, CP.purple, CP.teal, 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.cpidAccentEdge}
        />

        <View style={styles.cpidTop}>
          <View style={styles.cpidLogoRow}>
            <View style={styles.cpidLogoMark}>
              <Image
                source={require('@/assets/images/culturepass-logo.png')}
                style={styles.cpidLogoImage}
                contentFit="contain"
                accessibilityLabel="CulturePass"
              />
            </View>
            <Text style={styles.cpidLogoText}>CulturePass</Text>
          </View>
        </View>

        <View style={styles.cpidCenter}>
          <Text style={styles.cpidLabel}>CULTUREPASS ID</Text>
          <Text style={styles.cpidValue}>{cpid}</Text>
          <LinearGradient
            colors={['transparent', CP.teal, 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.cpidUnderline}
          />
        </View>

        <View style={styles.cpidMeta}>
          <View style={styles.cpidMetaItem}>
            <Text style={styles.cpidMetaLabel}>Name</Text>
            <Text style={styles.cpidMetaValue}>{displayName}</Text>
          </View>
          <View style={styles.cpidMetaItem}>
            <Text style={[styles.cpidMetaLabel, { color: tierConf.color }]}>Member since</Text>
            <Text style={styles.cpidMetaValue}>{memberSince || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.cpidFooter}>
          <Ionicons name="finger-print" size={20} color={CP.teal + '55'} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  section:       { paddingHorizontal: 20, marginTop: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionAccent: { width: 4, height: 22, borderRadius: 2, backgroundColor: CP.teal },
  sectionTitle:  { fontFamily: 'Poppins_700Bold', fontSize: 18, color: CP.text, letterSpacing: -0.3 },

  cpidCard: {
    borderRadius: 24, padding: 24, overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 14px 42px rgba(44,42,114,0.35)' },
      default: {
        shadowColor: CP.purple,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.35, shadowRadius: 28, elevation: 14,
      },
    }),
  },
  cpidAccentEdge: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2.5,
  },
  cpidTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
    marginBottom: 26,
  },
  cpidLogoRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cpidLogoMark: {
    width: 26,
    height: 26,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cpidLogoImage: { width: 26, height: 26 },
  cpidLogoText:    { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#FFF', letterSpacing: 0.4 },

  cpidCenter:    { alignItems: 'center', marginBottom: 26 },
  cpidLabel:     { fontFamily: 'Poppins_500Medium', fontSize: 9, color: CP.muted, letterSpacing: 4, marginBottom: 8 },
  cpidValue:     { fontFamily: 'Poppins_700Bold', fontSize: 30, color: '#FFF', letterSpacing: 5 },
  cpidUnderline: { width: 160, height: 1.5, marginTop: 10, opacity: 0.65 },

  cpidMeta:      { flexDirection: 'row', marginBottom: 20, gap: 8 },
  cpidMetaItem:  { flex: 1 },
  cpidMetaLabel: {
    fontFamily: 'Poppins_400Regular', fontSize: 9, color: CP.muted,
    textTransform: 'uppercase' as const, letterSpacing: 1.2, marginBottom: 4,
  },
  cpidMetaValue: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#FFF' },

  cpidFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 14,
  },
});
