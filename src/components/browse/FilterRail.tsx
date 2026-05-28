/**
 * FilterRail — single-row filter bar used across city, events, finder, and
 * directory pages.
 *
 * Layout (all in one line, nothing stacks):
 *
 *   [mode icons?] │ [←── scrollable chips ──→] │ [actions] [⊗]
 *
 *   modes   — optional icon-only mode switcher pinned at the left edge
 *   chips   — the value chips that scroll horizontally
 *   actions — optional icon-only buttons pinned at the right edge
 *   ⊗ clear — always present; red + tappable when activeCount > 0, else dimmed
 */
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { GlassView } from '@/design-system/ui/GlassView';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterChipItem {
  id: string;
  label: string;
  icon?: string;
  active: boolean;
  onPress: () => void;
}

export interface FilterChipGroup {
  items: FilterChipItem[];
  /** Thin divider before this group (ignored for the first group) */
  divider?: boolean;
}

export interface FilterRailMode {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  active: boolean;
  onPress: () => void;
}

export interface FilterRailAction {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  active?: boolean;
}

interface FilterRailProps {
  /** Groups of value chips in the scrollable center zone */
  groups: FilterChipGroup[];
  /** Icon-only mode switcher pinned at the left (optional) */
  modes?: FilterRailMode[];
  /** Icon-only action buttons pinned at the right */
  actions?: FilterRailAction[];
  /** Drives the red/dim state of the built-in clear button */
  activeCount: number;
  onClearAll: () => void;
  style?: object;
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

function Chip({ item }: { item: FilterChipItem }) {
  const colors = useColors();
  const accentColor = colors.primary;
  const scale = useSharedValue(1);

  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.9); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        item.onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: item.active }}
      hitSlop={3}
    >
      {/* Scale on Animated.View — ExpoGlassView cannot receive Reanimated styles */}
      <Animated.View style={[scaleStyle, { alignSelf: 'flex-start' }]}>
        <GlassView
          intensity={item.active ? 20 : 10}
          style={[
            ch.chip,
            {
              backgroundColor: item.active ? accentColor : colors.surface + '80',
              borderColor: item.active ? accentColor : colors.borderLight,
            },
          ]}
        >
          {item.icon ? (
            <Ionicons
              name={item.icon as keyof typeof Ionicons.glyphMap}
              size={11}
              color={item.active ? '#fff' : colors.textSecondary}
            />
          ) : null}
          <Text style={[ch.label, { color: item.active ? '#fff' : colors.text }]}>
            {item.label}
          </Text>
        </GlassView>
      </Animated.View>
    </Pressable>
  );
}

// ─── ModeButton ───────────────────────────────────────────────────────────────

function ModeButton({ mode }: { mode: FilterRailMode }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        mode.onPress();
      }}
      style={({ pressed }) => [
        { opacity: pressed ? 0.7 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={mode.accessibilityLabel}
      accessibilityState={{ selected: mode.active }}
    >
      <GlassView
        intensity={mode.active ? 20 : 10}
        style={[
          mb.btn,
          {
            backgroundColor: mode.active ? colors.primary + '18' : colors.surface + '80',
            borderColor: mode.active ? colors.primary + '50' : colors.borderLight,
          },
        ]}
      >
        <Ionicons
          name={mode.icon}
          size={14}
          color={mode.active ? colors.primary : colors.textSecondary}
        />
      </GlassView>
    </Pressable>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

function ActionButton({ action }: { action: FilterRailAction }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        action.onPress();
      }}
      style={({ pressed }) => [
        { opacity: pressed ? 0.7 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel}
      accessibilityState={{ selected: action.active }}
      hitSlop={4}
    >
      <GlassView
        intensity={action.active ? 20 : 10}
        style={[
          ab.btn,
          {
            backgroundColor: action.active ? colors.primary + '18' : colors.surface + '80',
            borderColor: action.active ? colors.primary + '44' : colors.borderLight,
          },
        ]}
      >
        <Ionicons
          name={action.icon}
          size={14}
          color={action.active ? colors.primary : colors.textSecondary}
        />
      </GlassView>
    </Pressable>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function VDivider() {
  const colors = useColors();
  return <View style={[dv.line, { backgroundColor: colors.borderLight }]} />;
}

// ─── FilterRail ───────────────────────────────────────────────────────────────

export function FilterRail({
  groups,
  modes,
  actions,
  activeCount,
  onClearAll,
  style,
}: FilterRailProps) {
  const colors = useColors();
  const { hPad } = useLayout();
  const hasModes   = modes   && modes.length > 0;
  const hasActions = actions && actions.length > 0;

  return (
    <View style={[fr.wrap, { borderBottomColor: colors.divider, backgroundColor: colors.background }, style]}>
      <View style={fr.row}>

        {/* ── Left: mode icon buttons ────────────────────────────── */}
        {hasModes && (
          <View style={[fr.modeStrip, { paddingLeft: hPad, borderRightColor: colors.borderLight }]}>
            {modes!.map((mode) => (
              <ModeButton key={mode.id} mode={mode} />
            ))}
          </View>
        )}

        {/* ── Center: scrollable value chips ─────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[fr.chipRow, { paddingLeft: hasModes ? 10 : hPad, paddingRight: 20 }]}
          accessibilityRole="tablist"
          style={{ flex: 1 }}
        >
          {groups.map((group, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && group.divider !== false && <VDivider />}
              {group.items.map((item) => (
                <Chip key={item.id} item={item} />
              ))}
            </React.Fragment>
          ))}
          <View style={{ width: 6 }} />
        </ScrollView>

        {/* ── Right: pinned action + clear buttons ────────────────── */}
        <View style={[fr.actionStrip, { borderLeftColor: colors.borderLight, paddingRight: hPad }]}>
          {hasActions && actions!.map((action, i) => (
            <ActionButton key={i} action={action} />
          ))}

          {activeCount > 0 && (
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                onClearAll();
              }}
              style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
              hitSlop={4}
            >
              <GlassView
                intensity={15}
                style={[
                  ab.btn,
                  {
                    backgroundColor: colors.error + '12',
                    borderColor: colors.error + '3A',
                  },
                ]}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={14}
                  color={colors.error}
                />
              </GlassView>
            </Pressable>
          )}
        </View>

      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const fr = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
  },
  modeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingRight: 10,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 8,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
});

const ch = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 16,
    ...Platform.select({
      android: { includeFontPadding: false as const },
      default: {},
    }),
  },
});

const mb = StyleSheet.create({
  btn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

const ab = StyleSheet.create({
  btn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({ web: { cursor: 'pointer' } as object, default: {} }),
  },
});

const dv = StyleSheet.create({
  line: { width: 1, height: 14, marginHorizontal: 5, alignSelf: 'center', opacity: 0.6 },
});

// ─── Backwards-compat export ──────────────────────────────────────────────────

/** @deprecated Use FilterRail directly */
export function FilterDivider() {
  return <VDivider />;
}
