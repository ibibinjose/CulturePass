import { View, Text, TextInput, Pressable, Modal, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/design-system/ui/Button';
import { FontFamily, Radius } from '@/design-system/tokens/theme';

type Props = {
  visible: boolean;
  value: string;
  loading: boolean;
  onChangeText: (t: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onScan: () => void;
};

export function ContactsLookupDialog({
  visible,
  value,
  loading,
  onChangeText,
  onClose,
  onSubmit,
  onScan,
}: Props) {
  const colors = useColors();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.title, { color: colors.text }]}>Find member</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Enter @handle, CulturePass ID, or scan their QR.
        </Text>

        <View style={[styles.inputRow, { borderColor: colors.borderLight, backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} style={{ marginLeft: 12 }} />
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="@handle or CP-ID"
            placeholderTextColor={colors.textTertiary}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={onSubmit}
            style={[styles.input, { color: colors.text }]}
          />
          <Pressable onPress={onScan} hitSlop={8} style={[styles.scanBtn, { borderColor: colors.borderLight }]}>
            <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <Pressable
          onPress={onScan}
          style={({ pressed }) => [
            styles.scanRow,
            { backgroundColor: colors.primarySoft, borderColor: colors.primary + '20' },
            pressed && { opacity: 0.88 },
          ]}
        >
          <Ionicons name="camera-outline" size={22} color={colors.primary} />
          <Text style={[styles.scanLabel, { color: colors.text }]}>Open scanner instead</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </Pressable>

        <View style={styles.actions}>
          <Button variant="outline" onPress={onClose} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button variant="primary" loading={loading} onPress={onSubmit} style={{ flex: 1.4 }}>
            Find
          </Button>
        </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 22,
    gap: 14,
    ...Platform.select({
      web: { boxShadow: '0 16px 48px rgba(0,0,0,0.18)' } as Record<string, unknown>,
      default: {},
    }),
  },
  title: { fontSize: 20, fontFamily: FontFamily.bold, letterSpacing: -0.3 },
  sub: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    minHeight: 52,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    paddingVertical: 12,
    ...Platform.select({ web: { outlineStyle: 'none' } as Record<string, unknown>, default: {} }),
  },
  scanBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  scanLabel: { flex: 1, fontSize: 14, fontFamily: FontFamily.semibold },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
