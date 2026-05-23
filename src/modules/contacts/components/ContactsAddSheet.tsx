import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { FontFamily, Radius } from '@/design-system/tokens/theme';
import { Button } from '@/design-system/ui/Button';
import { EventLiquidModalBody } from '@/modules/events/components/detail/EventLiquidModalBody';

type Props = {
  visible: boolean;
  isDesktop: boolean;
  onClose: () => void;
  onScan: () => void;
  onLookup: () => void;
};

export function ContactsAddSheet({ visible, isDesktop, onClose, onScan, onLookup }: Props) {
  const colors = useColors();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <EventLiquidModalBody isDesktop={isDesktop} style={styles.sheet}>
        <View style={[styles.handle, { backgroundColor: colors.borderLight }]} />
        <Text style={[styles.title, { color: colors.text }]}>Add connection</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Saved on this device only — not synced to the cloud.
        </Text>

        <Option
          icon="qr-code-outline"
          title="Scan QR code"
          desc="From a CulturePass card or profile"
          onPress={onScan}
          colors={colors}
        />
        <Option
          icon="search-outline"
          title="Find by handle or ID"
          desc="Look up @username or CP-ID"
          onPress={onLookup}
          colors={colors}
        />

        <Button variant="ghost" onPress={onClose} style={{ marginTop: 8 }}>
          Cancel
        </Button>
        </EventLiquidModalBody>
      </View>
    </Modal>
  );
}

function Option({
  icon,
  title,
  desc,
  onPress,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={[styles.optionIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.optionCopy}>
        <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.optionDesc, { color: colors.textTertiary }]}>{desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { maxHeight: '55%', paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  title: { fontSize: 22, fontFamily: FontFamily.bold, letterSpacing: -0.4 },
  sub: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 20, marginBottom: 4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: { flex: 1, gap: 2 },
  optionTitle: { fontSize: 16, fontFamily: FontFamily.semibold },
  optionDesc: { fontSize: 13, fontFamily: FontFamily.regular },
});
