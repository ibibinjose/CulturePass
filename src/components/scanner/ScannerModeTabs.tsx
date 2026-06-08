import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { FontFamily, Radius } from '@/design-system/tokens/theme';
import { scanAccentGradient, SCAN_MODE_ACCENT } from './scannerTheme';
import type { ScanMode } from './types';

type Props = {
  mode: ScanMode;
  onModeChange: (mode: ScanMode) => void;
  showTickets: boolean;
};

export function ScannerModeTabs({ mode, onModeChange, showTickets }: Props) {
  const colors = useColors();

  return (
    <View style={[styles.track, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
      <Tab
        active={mode === 'culturepass'}
        label="Identity"
        sub="Member lookup"
        icon="person-circle-outline"
        scanMode="culturepass"
        onPress={() => onModeChange('culturepass')}
        colors={colors}
      />
      {showTickets ? (
        <Tab
          active={mode === 'tickets'}
          label="Tickets"
          sub="Gate check-in"
          icon="ticket-outline"
          scanMode="tickets"
          onPress={() => onModeChange('tickets')}
          colors={colors}
        />
      ) : null}
    </View>
  );
}

function Tab({
  active,
  label,
  sub,
  icon,
  scanMode,
  onPress,
  colors,
}: {
  active: boolean;
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  scanMode: ScanMode;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const accent = SCAN_MODE_ACCENT[scanMode];

  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      {active ? (
        <LinearGradient
          colors={scanAccentGradient(scanMode)}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Ionicons name={icon} size={18} color={active ? '#FFFFFF' : colors.textTertiary} />
      <View style={styles.tabCopy}>
        <Text
          style={[
            styles.tabLabel,
            { color: active ? '#FFFFFF' : colors.text },
            active && { fontFamily: FontFamily.bold },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.tabSub,
            { color: active ? 'rgba(255,255,255,0.82)' : colors.textTertiary },
          ]}
          numberOfLines={1}
        >
          {sub}
        </Text>
      </View>
      {active ? (
        <View style={[styles.activeDot, { backgroundColor: '#FFFFFF' }]} />
      ) : (
        <View style={[styles.inactiveDot, { backgroundColor: accent + '30' }]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 5,
    borderRadius: Radius.lg,
    gap: 6,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Platform.select({
      web: { cursor: 'pointer' } as Record<string, unknown>,
      default: {},
    }),
  },
  tabActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.14)' } as Record<string, unknown>,
    }),
  },
  tabCopy: { flex: 1, minWidth: 0, gap: 1 },
  tabLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  tabSub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inactiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});