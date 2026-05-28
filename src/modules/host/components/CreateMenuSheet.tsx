import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, Spacing, Radius } from '@/design-system/tokens/theme';

interface CreateMenuSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Fast, obvious Create menu.
 * Replaces fragmented entry points.
 * One tap from Hostspace main screen.
 */
export function CreateMenuSheet({ visible, onClose }: CreateMenuSheetProps) {
  const colors = useColors();

  const options = [
    { label: 'New Profile', icon: 'person-add-outline', route: '/hostspace/create' as const, desc: 'Community, Business, Artist, Venue...' },
    { label: 'New Event', icon: 'calendar-outline', route: '/hostspace/create?category=event' as const, desc: 'Festival, workshop, gathering' },
    { label: 'New Listing', icon: 'pricetag-outline', route: '/hostspace/create?category=market' as const, desc: 'Sell products or services' },
  ];

  const handlePress = (route: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 80);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: colors.text }]}>What would you like to create?</Text>

          {options.map((opt, i) => (
            <Pressable key={i} style={styles.option} onPress={() => handlePress(opt.route)}>
              <View style={[styles.iconWrap, { backgroundColor: CultureTokens.indigo + '15' }]}>
                <Ionicons name={opt.icon as any} size={22} color={CultureTokens.indigo} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.label, { color: colors.text }]}>{opt.label}</Text>
                <Text style={[styles.desc, { color: colors.textSecondary }]}>{opt.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          ))}

          <Text style={[styles.footer, { color: colors.textTertiary }]}>
            All creations are saved as drafts automatically.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, paddingBottom: 40 },
  handle: { width: 36, height: 4, backgroundColor: '#ccc', alignSelf: 'center', borderRadius: 2, marginBottom: Spacing.md },
  title: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', marginBottom: Spacing.lg, textAlign: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  textWrap: { flex: 1 },
  label: { fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  desc: { fontSize: 13, marginTop: 2 },
  footer: { textAlign: 'center', fontSize: 12, marginTop: Spacing.lg, opacity: 0.6 },
});