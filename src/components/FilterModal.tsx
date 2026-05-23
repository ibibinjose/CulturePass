import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TouchableWithoutFeedback, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { FontFamily } from '@/design-system/tokens/theme';
import { Button } from '@/design-system/ui/Button';
import { EventLiquidModalBody } from '@/modules/events/components/detail/EventLiquidModalBody';

export type DateFilter = 'all' | 'today' | 'this_weekend';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
}

export default function FilterModal({
  visible,
  onClose,
  selectedDateFilter,
  onDateFilterChange,
}: FilterModalProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();

  const handleApply = () => {
    onClose();
  };

  const handleClear = () => {
    onDateFilterChange('all');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
            <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <EventLiquidModalBody isDesktop={isDesktop} style={styles.modalSheet}>
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Filter Search</Text>
              <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [styles.closeButton, { backgroundColor: colors.primarySoft }, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Close filters"
              >
                <Ionicons name="close" size={22} color={colors.primary} />
              </Pressable>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20, paddingBottom: insets.bottom + 100 }}
            >
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Date</Text>
                <View style={styles.dateOptions}>
                  {[
                    { id: 'all', label: 'All Dates' },
                    { id: 'today', label: 'Today' },
                    { id: 'this_weekend', label: 'This Weekend' },
                  ].map((option) => {
                    const active = selectedDateFilter === option.id;
                    return (
                        <Pressable
                            key={option.id}
                            style={({ pressed }) => [
                                styles.dateOption,
                                {
                                    backgroundColor: active ? colors.primarySoft : colors.backgroundSecondary,
                                    borderColor: active ? colors.primary : colors.borderLight,
                                    opacity: pressed ? 0.9 : 1
                                }
                            ]}
                            onPress={() => onDateFilterChange(option.id as DateFilter)}
                        >
                            <Text style={[styles.dateOptionText, { color: active ? colors.primary : colors.text, fontFamily: active ? FontFamily.bold : FontFamily.medium }]}>
                                {option.label}
                            </Text>
                        </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Placeholder for more sections like Category, Proximity, etc. */}
              <View style={[styles.section, { marginTop: 24 }]}>
                 <Text style={[styles.sectionTitle, { color: colors.text }]}>Proximity</Text>
                 <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: FontFamily.regular }}>Filters apply automatically to your current city.</Text>
              </View>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: colors.borderLight, paddingBottom: Platform.OS === 'web' ? 24 : insets.bottom + 16 }]}>
              <Button
                variant="outline"
                onPress={handleClear}
                style={{ flex: 1 }}
                labelStyle={{ color: colors.textSecondary }}
              >
                Clear
              </Button>
              <Button
                variant="primary"
                onPress={handleApply}
                style={{ flex: 2 }}
              >
                Apply Filters
              </Button>
            </View>
        </EventLiquidModalBody>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.8,
  },
  dateOptions: {
    flexDirection: 'column',
    gap: 10,
  },
  dateOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  dateOptionText: {
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
