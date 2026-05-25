import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import { M3Button } from '@/design-system/ui';
import { M3Typography } from '@/design-system/tokens/theme';

interface ReminderPopupModalProps {
  visible: boolean;
  onClose: () => void;
  onJoinReminders: () => void;
}

export function ReminderPopupModal({
  visible,
  onClose,
  onJoinReminders,
}: ReminderPopupModalProps) {
  const m3Colors = useM3Colors();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: m3Colors.surface,
              borderColor: m3Colors.outlineVariant,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: m3Colors.onSurface }]}>
              Stay Updated with Reminders
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={m3Colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <View style={[styles.iconContainer, { backgroundColor: m3Colors.primaryContainer }]}>
              <Ionicons name="notifications" size={32} color={m3Colors.onPrimaryContainer} />
            </View>
            
            <Text style={[styles.message, { color: m3Colors.onSurfaceVariant }]}>
              Join our reminder list to receive notifications about new events, 
              cultural activities, and exclusive perks in your area!
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <M3Button 
              variant="outlined" 
              onPress={onClose}
              style={styles.cancelButton}
            >
              Not Now
            </M3Button>
            <M3Button 
              variant="filled" 
              onPress={onJoinReminders}
              style={styles.joinButton}
            >
              Join Reminders
            </M3Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 28,
    padding: 24,
    gap: 20,
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0 10px 30px rgba(0,0,0,0.15)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...M3Typography.headlineSmall,
    flex: 1,
  },
  closeButton: {
    padding: 4,
    borderRadius: 16,
  },
  body: {
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    ...M3Typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  joinButton: {
    flex: 1,
  },
});