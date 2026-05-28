import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, Spacing, Radius } from '@/design-system/tokens/theme';

interface UniversalShareSheetProps {
  visible: boolean;
  title: string;
  url: string;
  imageUrl?: string;
  onClose: () => void;
}

/**
 * Universal Share Sheet
 * Works for Profiles, Events, Listings, Communities, etc.
 * One component, consistent experience on iOS, Android, and Web.
 */
export function UniversalShareSheet({ visible, title, url, onClose }: UniversalShareSheetProps) {
  const colors = useColors();

  const handleShare = async (platform?: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();

    const message = `${title}\n\n${url}`;

    try {
      if (platform === 'copy') {
        await Clipboard.setStringAsync(url);
        onClose();
        return;
      }

      await Share.share({
        message,
        url, // iOS
        title,
      });
    } catch (e) {
      console.warn('Share failed', e);
    } finally {
      onClose();
    }
  };

  const shareOptions = [
    { label: 'Copy Link', icon: 'copy-outline' as const, action: 'copy' },
    { label: 'Share via...', icon: 'share-outline' as const, action: 'native' },
    { label: 'WhatsApp', icon: 'logo-whatsapp' as const, action: 'whatsapp' },
    { label: 'Telegram', icon: 'paper-plane-outline' as const, action: 'telegram' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Share</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>{title}</Text>

          <View style={styles.options}>
            {shareOptions.map((opt, idx) => (
              <Pressable
                key={idx}
                style={styles.option}
                onPress={() => handleShare(opt.action)}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.borderLight }]}>
                  <Ionicons name={opt.icon} size={20} color={colors.text} />
                </View>
                <Text style={[styles.optionLabel, { color: colors.text }]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            Share this link anywhere — it works on web and mobile.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title: { fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  itemTitle: { fontSize: 15, fontFamily: 'Poppins_500Medium', marginBottom: Spacing.lg, opacity: 0.9 },
  options: { gap: 2 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  optionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  optionLabel: { fontSize: 16, fontFamily: 'Poppins_500Medium' },
  hint: { textAlign: 'center', fontSize: 12, marginTop: Spacing.lg, opacity: 0.6 },
});