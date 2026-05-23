// components/HeaderLogo.tsx
import React from 'react';
import { Pressable, View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CultureImage } from '@/design-system/ui/CultureImage';

export default function HeaderLogo() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/my-space' as any);
  };

  return (
    <Pressable 
      onPress={handlePress} 
      style={({ pressed }) => [
        styles.container,
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
      ]}
      accessibilityRole="button"
      accessibilityLabel="Open profile"
    >
      {isAuthenticated && user?.avatarUrl ? (
        <CultureImage uri={user.avatarUrl} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, { backgroundColor: colors.background, borderColor: colors.borderLight, justifyContent: 'center', alignItems: 'center' }]}> 
          <Ionicons name="person" size={20} color={colors.textTertiary} />
        </View>
      )}
      {isAuthenticated && (
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {user?.displayName?.split(' ')[0] || 'Profile'}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  name: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold', // Matches existing typography
    maxWidth: 100,
  },
});
