import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { User } from '@shared/schema';
import { CP } from './profileUtils';

type Props = {
  user: User;
};

export default function UserProfileAbout({ user }: Props) {
  const colors = useColors();
  if (!user.bio) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>About</Text>
      </View>
      <View style={styles.card}>
        <Text style={[styles.bioText, { color: colors.textSecondary }]}>{user.bio}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section:       { paddingHorizontal: 20, marginTop: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionAccent: { width: 4, height: 22, borderRadius: 2, backgroundColor: CP.teal },
  sectionTitle:  { fontFamily: 'Poppins_700Bold', fontSize: 18, color: CP.text, letterSpacing: -0.3 },

  card: {
    backgroundColor: CP.surface,
    borderRadius: 20, padding: 20,
    ...Platform.select({
      web: { boxShadow: '0px 8px 24px rgba(0,0,0,0.3)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, 
        shadowRadius: 24, 
        elevation: 8,
      },
    }),
  },
  bioText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    lineHeight: 26,
  },
});
