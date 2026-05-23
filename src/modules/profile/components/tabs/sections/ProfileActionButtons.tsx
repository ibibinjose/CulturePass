import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { MaterialExpressive } from '@/design-system/tokens/theme';
import { M3Button } from '@/design-system/ui';

interface ProfileActionButtonsProps {
  nav: (path: string) => void;
  setShowScanner: (show: boolean) => void;
  handleShare: () => void;
}

export const ProfileActionButtons = React.memo(({
  nav,
  setShowScanner,
  handleShare,
}: ProfileActionButtonsProps) => {
  const m3 = useM3Colors();
  const { hPad } = useLayout();

  return (
    <View style={[styles.shell, { backgroundColor: m3.surfaceContainerLow, borderColor: m3.outlineVariant, marginHorizontal: hPad, marginTop: 12, flexDirection: 'row', gap: 10, padding: 12 }]}>
      {[
        { icon: 'scan' as const, label: 'Scan', onPress: () => { if (Platform.OS !== 'web') Haptics.selectionAsync(); setShowScanner(true); } },
        { icon: 'people' as const, label: 'Contacts', onPress: () => nav('/contacts') },
        { icon: 'share-social' as const, label: 'Share', onPress: handleShare },
      ].map(btn => (
        <View key={btn.label} style={styles.actionCell}>
          <M3Button variant="tonal" leftIcon={btn.icon} onPress={btn.onPress} fullWidth>{btn.label}</M3Button>
        </View>
      ))}
    </View>
  );
});

ProfileActionButtons.displayName = 'ProfileActionButtons';

const styles = StyleSheet.create({
  shell: {
    borderRadius: MaterialExpressive.shape.cornerExtraLarge,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  actionCell: { flex: 1 },
});
