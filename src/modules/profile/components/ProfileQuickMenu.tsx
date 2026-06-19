/**
 * ProfileQuickMenu — quick links card for profile page.
 * Same items as ProfileHeaderBar dropdown, displayed as an always-visible card.
 * ProfileQuickMenuModal — burger-triggered modal with same items.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/theme';
import { Card } from '@/design-system/ui/Card';
import { TextStyles } from '@/design-system/tokens/typography';
import { CREATE_HUB_ROUTE } from '@/constants/navigation/experienceNav';
import { DIGITAL_ID_ROUTE } from '@/lib/digitalIdRoutes';

export const QUICK_MENU_ITEMS = [
  { key: 'edit', label: 'Edit Profile', icon: 'create-outline', route: '/profile/edit' },
  { key: 'create', label: 'Create', icon: 'add-circle-outline', route: CREATE_HUB_ROUTE },
  { key: 'tickets', label: 'My Tickets', icon: 'ticket-outline', route: '/tickets' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet-outline', route: '/payment/wallet' },
  { key: 'saved', label: 'Saved', icon: 'bookmark-outline', route: '/saved' },
  { key: 'qr', label: 'Digital ID', icon: 'id-card-outline', route: DIGITAL_ID_ROUTE },
  { key: 'communities', label: 'Community', icon: 'people-outline', route: '/(tabs)/community' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', route: '/settings' },
] as const;

export interface ProfileQuickMenuProps {
  /** Horizontal layout (for web bottom bar) */
  horizontal?: boolean;
}

export function ProfileQuickMenu({ horizontal = false }: ProfileQuickMenuProps) {
  const colors = useColors();

  const handlePress = (route: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as never);
  };

  if (horizontal) {
    return (
      <Card padding={20} style={styles.cardHorizontal}>
        <Text style={TextStyles.badgeCaps}>QUICK MENU</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {QUICK_MENU_ITEMS.map((item) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [
                styles.itemHorizontal,
                { backgroundColor: pressed ? colors.surfaceElevated : 'transparent', borderColor: colors.borderLight },
              ]}
              onPress={() => handlePress(item.route)}
              accessibilityLabel={item.label}
              accessibilityRole="button"
            >
              <View style={[styles.iconWrap, { backgroundColor: CultureTokens.indigo + '12' }]}>
                <Ionicons name={item.icon as never} size={18} color={CultureTokens.indigo} />
              </View>
              <Text style={[styles.labelHorizontal, { color: colors.text }]} numberOfLines={1}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Card>
    );
  }

  return (
    <Card padding={16}>
      <Text style={[TextStyles.badgeCaps, { marginBottom: 14 }]}>QUICK MENU</Text>
      <View style={styles.grid}>
        {QUICK_MENU_ITEMS.map((item) => (
          <Pressable
            key={item.key}
            style={({ pressed }) => [
              styles.item,
              { backgroundColor: pressed ? colors.surfaceElevated : 'transparent' },
            ]}
            onPress={() => handlePress(item.route)}
            accessibilityLabel={item.label}
            accessibilityRole="button"
          >
            <View style={[styles.iconWrap, { backgroundColor: CultureTokens.indigo + '12' }]}>
              <Ionicons name={item.icon as never} size={20} color={CultureTokens.indigo} />
            </View>
            <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(44,42,114,0.08)' },
      default: { elevation: 2 },
    }),
  },
  cardHorizontal: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  grid: { gap: 4 },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  itemHorizontal: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 92,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  labelHorizontal: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
});

/** Burger icon that opens quick menu in a modal */
export function ProfileQuickMenuTrigger({
  colors,
  variant = 'hero',
}: {
  colors: ReturnType<typeof useColors>;
  /** 'hero' = light icon on gradient; 'surface' = dark icon on light surface */
  variant?: 'hero' | 'surface';
}) {
  const [visible, setVisible] = useState(false);
  const isHero = variant === 'hero';

  const handlePress = (route: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVisible(false);
    router.push(route as never);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          modalStyles.burgerBtn,
          {
            backgroundColor: isHero ? 'rgba(255,255,255,0.15)' : colors.surface,
            borderWidth: isHero ? 0 : 1,
            borderColor: colors.borderLight,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Open quick menu"
      >
        <Ionicons name="menu" size={22} color={isHero ? 'rgba(255,255,255,0.95)' : colors.text} />
      </Pressable>
      <Modal transparent visible={visible} onRequestClose={() => setVisible(false)} animationType="fade">
        <View style={modalStyles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setVisible(false)} />
          <View style={[modalStyles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <View style={[modalStyles.header, { borderBottomColor: colors.borderLight }]}>
              <Text style={TextStyles.badgeCaps}>QUICK MENU</Text>
              <Pressable onPress={() => setVisible(false)} hitSlop={12} accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={modalStyles.scroll} showsVerticalScrollIndicator={false}>
              {QUICK_MENU_ITEMS.map((item) => (
                <Pressable
                  key={item.key}
                  style={({ pressed }) => [
                    modalStyles.item,
                    { backgroundColor: pressed ? colors.surfaceElevated : 'transparent' },
                  ]}
                  onPress={() => handlePress(item.route)}
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                >
                  <View style={[modalStyles.iconWrap, { backgroundColor: CultureTokens.indigo + '12' }]}>
                    <Ionicons name={item.icon as never} size={20} color={CultureTokens.indigo} />
                  </View>
                  <Text style={[modalStyles.label, { color: colors.text }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const modalStyles = StyleSheet.create({
  burgerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.2)' },
      default: { elevation: 8 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  scroll: { maxHeight: 360, paddingVertical: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
});
