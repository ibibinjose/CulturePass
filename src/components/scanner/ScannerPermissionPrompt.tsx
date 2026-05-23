import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { M3Button } from '@/design-system/ui';
import { FontFamily, Radius } from '@/design-system/tokens/theme';
import { SCAN_WELL } from './scannerTheme';

type Props = {
  onRequestPermission: () => void;
};

export function ScannerPermissionPrompt({ onRequestPermission }: Props) {
  return (
    <View style={styles.card}>
      <Ionicons name="camera-outline" size={32} color={SCAN_WELL.textMuted} />
      <Text style={styles.title}>Camera access</Text>
      <Text style={styles.body}>
        Allow the camera to scan QR codes at the gate. You can still enter codes manually below.
      </Text>
      <M3Button variant="filled" onPress={onRequestPermission} style={{ alignSelf: 'stretch' }}>
        Allow camera
      </M3Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
    borderRadius: Radius.lg,
    backgroundColor: SCAN_WELL.bgElevated,
    borderWidth: 1,
    borderColor: SCAN_WELL.border,
    marginBottom: 16,
  },
  title: {
    color: SCAN_WELL.text,
    fontSize: 17,
    fontFamily: FontFamily.bold,
  },
  body: {
    color: SCAN_WELL.textMuted,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
});
