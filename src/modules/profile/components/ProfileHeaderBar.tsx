import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, BorderTokens } from '@/design-system/tokens/theme';
import { routeWithRedirect } from '@/lib/routes';
import { DIGITAL_ID_ROUTE } from '@/lib/digitalIdRoutes';

export interface ProfileHeaderBarProps {
  compact?: boolean;
  avatarSize?: number;
  lightMode?: boolean;
  onLogoPress?: () => void;
}

const PROFILE_MENU_ITEMS = [
  { key: 'profile', label: 'MySpace', icon: 'person-outline', route: '/(tabs)/myspace' },
  { key: 'edit', label: 'Edit Profile', icon: 'create-outline', route: '/profile/edit' },
  { key: 'tickets', label: 'My Tickets', icon: 'ticket-outline', route: '/tickets' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet-outline', route: '/payment/wallet' },
  { key: 'saved', label: 'Saved', icon: 'bookmark-outline', route: '/saved' },
  { key: 'qr', label: 'Digital ID', icon: 'id-card-outline', route: DIGITAL_ID_ROUTE },
  { key: 'communities', label: 'Communities', icon: 'people-outline', route: '/(tabs)/communities' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', route: '/settings' },
] as const;

export function ProfileHeaderBar({
  compact = false,
  avatarSize = 40,
  lightMode = false,
  onLogoPress,
}: ProfileHeaderBarProps) {
  const colors = useColors();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  const displayName = user?.displayName ?? user?.username ?? user?.id?.slice(0, 8) ?? 'You';
  const initials = displayName.trim().split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const textColor = lightMode ? BorderTokens.white : colors.text;
  const mutedColor = lightMode ? 'rgba(255,255,255,0.75)' : colors.textSecondary;
  const avatarRadius = avatarSize / 2;
  const ringSize = avatarSize + 4;
  const ringRadius = ringSize / 2;

  const handleMenuSelect = (route: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuVisible(false);
    if (route === 'signout') {
      logout('/(tabs)');
      return;
    }
    router.push(route as never);
  };

  const handlePress = () => {
    if (isAuthenticated) {
      setMenuVisible(true);
    } else {
      onLogoPress?.();
      router.push(routeWithRedirect('/(onboarding)/login', '/(tabs)') as never);
    }
  };

  if (isAuthenticated) {
    return (
      <>
        <Pressable
          style={({ pressed }) => [
            styles.wrap,
            compact && styles.wrapCompact,
            pressed && styles.pressed,
            Platform.OS === 'web' && styles.webPointer,
          ]}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel="Open profile menu"
        >
          <View style={[styles.avatarWrap, { width: avatarSize, height: avatarSize, borderRadius: avatarRadius }]}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={{ width: avatarSize, height: avatarSize, borderRadius: avatarRadius }}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={[CultureTokens.indigo, CultureTokens.coral]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: avatarRadius }]}
              >
                <View style={styles.initialsWrap}>
                  <Text style={[styles.initials, { fontSize: Math.round(avatarSize * 0.38), color: BorderTokens.white }]} numberOfLines={1}>
                    {initials}
                  </Text>
                </View>
              </LinearGradient>
            )}
            <View style={[styles.avatarRing, { width: ringSize, height: ringSize, borderRadius: ringRadius, borderColor: lightMode ? 'rgba(255,255,255,0.4)' : colors.border }]} />
          </View>
          {!compact && (
            <View style={styles.nameWrap}>
              <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>{displayName}</Text>
              <Ionicons name="chevron-down" size={14} color={mutedColor} />
            </View>
          )}
        </Pressable>

        <Modal transparent visible={menuVisible} onRequestClose={() => setMenuVisible(false)} animationType="fade">
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuVisible(false)} />
            <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <View style={[styles.menuHeader, { borderBottomColor: colors.borderLight }]}>
                <View style={styles.menuHeaderRow}>
                  {user?.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={styles.menuAvatar} contentFit="cover" />
                  ) : (
                    <LinearGradient
                      colors={[CultureTokens.indigo, CultureTokens.coral]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.menuAvatar, styles.menuAvatarFallback]}
                    >
                      <Text style={styles.menuAvatarText} numberOfLines={1}>{initials}</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.menuHeaderText}>
                    <Text style={[styles.menuHeaderName, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
                    {user?.email && (
                      <Text style={[styles.menuHeaderEmail, { color: colors.textSecondary }]} numberOfLines={1}>{user.email}</Text>
                    )}
                  </View>
                </View>
              </View>
              <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
                {PROFILE_MENU_ITEMS.map((item) => (
                  <Pressable
                    key={item.key}
                    style={({ pressed }) => [
                      styles.menuItem,
                      { backgroundColor: pressed ? colors.surfaceElevated : 'transparent' },
                    ]}
                    onPress={() => handleMenuSelect(item.route)}
                  >
                    <Ionicons name={item.icon as never} size={20} color={colors.textSecondary} />
                    <Text style={[styles.menuItemLabel, { color: colors.text }]} numberOfLines={1}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  </Pressable>
                ))}
              </ScrollView>
              <View style={[styles.menuFooter, { borderTopColor: colors.borderLight }]}>
                <Pressable
                  style={({ pressed }) => [styles.signOutBtn, pressed && styles.pressedStrong]}
                  onPress={() => handleMenuSelect('signout')}
                >
                  <Ionicons name="log-out-outline" size={20} color={CultureTokens.error} />
                  <Text style={[styles.signOutText, { color: CultureTokens.error }]} numberOfLines={1}>Sign Out</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.wrap,
        styles.wrapGuest,
        pressed && styles.pressedGuest,
        Platform.OS === 'web' && styles.webPointer,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Sign in"
    >
      <View style={[styles.logoCircle, { backgroundColor: lightMode ? 'rgba(255,255,255,0.2)' : colors.surfaceElevated }]}>
        <Ionicons name="person-outline" size={avatarSize * 0.55} color={lightMode ? BorderTokens.white : colors.textSecondary} />
      </View>
      {!compact && (
        <Text style={[styles.signInLabel, { color: textColor }]} numberOfLines={1}>Sign In</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wrapCompact: {
    gap: 0,
  },
  wrapGuest: {
    gap: 8,
  },
  pressed: { opacity: 0.85 },
  pressedGuest: { opacity: 0.9 },
  pressedStrong: { opacity: 0.8 },
  webPointer: { cursor: 'pointer' as never },
  avatarWrap: {
    overflow: 'hidden',
    position: 'relative',
  },
  avatarRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    borderWidth: 2,
  },
  initialsWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'Poppins_700Bold',
  },
  nameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 120,
  },
  name: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInLabel: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  menuCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  menuHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  menuAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAvatarText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: BorderTokens.white,
  },
  menuHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  menuHeaderName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  menuHeaderEmail: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  menuScroll: {
    maxHeight: 320,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
  },
  menuFooter: {
    padding: 12,
    borderTopWidth: 1,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: CultureTokens.error + '12',
  },
  signOutText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
});