import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, Spacing, Radius } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';

export type HostItemType = 'profile' | 'event' | 'listing';

export interface HostItemAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
}

interface HostItemActionSheetProps {
  visible: boolean;
  itemType: HostItemType;
  itemName: string;
  onClose: () => void;
  actions: HostItemAction[];
}

/**
 * Unified Action Sheet for Host Creations (Profiles, Events, Listings).
 * 
 * Provides consistent CRUD + Sharing + Monitoring actions across iOS, Android, and Web.
 * 
 * On mobile: Renders as a nice bottom sheet style modal.
 * On web: Renders as a centered dialog (can be upgraded to popover later).
 */
export function HostItemActionSheet({
  visible,
  itemType,
  itemName,
  onClose,
  actions,
}: HostItemActionSheetProps) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = width > 768;

  const handleActionPress = (action: HostItemAction) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onClose();
    // Small delay so the sheet closes smoothly before action
    setTimeout(() => {
      action.onPress();
    }, 120);
  };

  const title = `Manage ${itemType === 'profile' ? 'Profile' : itemType === 'event' ? 'Event' : 'Listing'}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isWeb ? 'fade' : 'slide'}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
              maxWidth: isDesktop ? 420 : '100%',
              alignSelf: 'center',
              marginBottom: isWeb ? 'auto' : 0,
              marginTop: isWeb ? 'auto' : undefined,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {itemName}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={20}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Actions */}
          <View style={styles.actions}>
            {actions.map((action, index) => (
              <Pressable
                key={action.key}
                style={({ pressed }) => [
                  styles.actionRow,
                  pressed && { backgroundColor: colors.borderLight + '40' },
                  index < actions.length - 1 && styles.actionBorder,
                ]}
                onPress={() => handleActionPress(action)}
              >
                <View style={styles.actionContent}>
                  <Ionicons
                    name={action.icon}
                    size={20}
                    color={action.destructive ? CultureTokens.coral : colors.text}
                    style={styles.actionIcon}
                  />
                  <Text
                    style={[
                      styles.actionLabel,
                      {
                        color: action.destructive ? CultureTokens.coral : colors.text,
                      },
                    ]}
                  >
                    {action.label}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textTertiary}
                />
              </Pressable>
            ))}
          </View>

          {/* Footer hint */}
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            Actions are available on all platforms
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingBottom: 12,
    overflow: 'hidden',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    maxWidth: 260,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  actions: {
    paddingHorizontal: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  actionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 14,
  },
  actionLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },
  hint: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: Spacing.sm,
    opacity: 0.6,
  },
});

export default HostItemActionSheet;