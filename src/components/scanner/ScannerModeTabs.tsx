import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily, Radius, SignatureGradient } from '@/design-system/tokens/theme';
import type { ScanMode } from './types';

type Props = {
  mode: ScanMode;
  onModeChange: (mode: ScanMode) => void;
  showTickets: boolean;
};

export function ScannerModeTabs({ mode, onModeChange, showTickets }: Props) {
  const colors = useColors();

  return (
    <View style={[styles.track, { backgroundColor: colors.backgroundSecondary }]}>
      <Tab
        active={mode === 'culturepass'}
        label="Identity"
        icon="person-circle-outline"
        onPress={() => onModeChange('culturepass')}
        colors={colors}
      />
      {showTickets ? (
        <Tab
          active={mode === 'tickets'}
          label="Tickets"
          icon="ticket-outline"
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
  icon,
  onPress,
  colors,
}: {
  active: boolean;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      {active ? (
        <LinearGradient
          colors={SignatureGradient as unknown as [string, string]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Ionicons name={icon} size={17} color={active ? '#FFFFFF' : colors.textTertiary} />
      <Text
        style={[
          styles.tabLabel,
          { color: active ? '#FFFFFF' : colors.textSecondary },
          active && { fontFamily: FontFamily.bold },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.lg,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
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
        shadowColor: CultureTokens.violet,
        shadowOpacity: 0.28,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
      web: { boxShadow: `0 4px 14px ${CultureTokens.violet}44` } as Record<string, unknown>,
    }),
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
});
