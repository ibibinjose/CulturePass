import React from 'react';
import { View, Platform, AccessibilityInfo, StyleSheet, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import {
  GlassView as ExpoGlassView,
  isGlassEffectAPIAvailable,
  type GlassStyle,
} from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { LiquidGlassTokens, MaterialExpressive, glass } from '@/design-system/tokens/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import { withAlpha } from '@/lib/withAlpha';

/** Solid frosted tint (blur stack veil / Android plate). Handles hex and rgb/rgba. */
function glassTint(base: string, opacity: number): string {
  const t = (base || '').trim();
  if (t.startsWith('#')) return withAlpha(t, opacity);
  const rgbaM = t.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/i);
  if (rgbaM) {
    return `rgba(${rgbaM[1]},${rgbaM[2]},${rgbaM[3]},${opacity})`;
  }
  const rgbM = t.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbM) {
    return `rgba(${rgbM[1]},${rgbM[2]},${rgbM[3]},${opacity})`;
  }
  return withAlpha('#64748b', opacity);
}

/**
 * Layout props that describe how *children* are arranged. These must live on the inner
 * wrapper — the outer shell also had them applied, which made the outer a row with
 * [backdrop, content] as flex siblings and broke Android (and some iOS fallback) layouts.
 *
 * Sizing (`width`, `height`, `flex`, `alignSelf`, …) stays on the outer glass shell.
 */
const CHILD_AXIS_KEYS: (keyof ViewStyle)[] = [
  'flexDirection',
  'alignItems',
  'alignContent',
  'justifyContent',
  'gap',
  'flexWrap',
];

function splitGlassLayoutStyle(style: ViewProps['style']): { outer: ViewStyle; content: ViewStyle } {
  const flat = StyleSheet.flatten(style) as ViewStyle | undefined;
  const content: ViewStyle = { flex: 1, minWidth: 0 };
  if (!flat) {
    return { outer: {}, content };
  }
  const outer = { ...flat } as Record<string, unknown>;
  for (const key of CHILD_AXIS_KEYS) {
    const v = flat[key];
    if (v !== undefined) {
      (content as Record<string, unknown>)[key as string] = v;
      delete outer[key];
    }
  }
  if (content.flexDirection === 'row' && content.alignItems === undefined) {
    content.alignItems = 'center';
  }
  return { outer: outer as ViewStyle, content };
}

function readBackgroundColor(style: ViewProps['style']): string | undefined {
  const flat = StyleSheet.flatten(style) as ViewStyle | undefined;
  const bg = flat?.backgroundColor;
  return typeof bg === 'string' ? bg : undefined;
}

/** Maps blur intensity to Material 3 Expressive–style elevation on Android */
function androidElevationFromIntensity(intensity?: number): number {
  const i = intensity ?? 20;
  if (i <= 12) return MaterialExpressive.elevation.level1;
  if (i <= 22) return MaterialExpressive.elevation.level2;
  if (i <= 32) return MaterialExpressive.elevation.level3;
  return MaterialExpressive.elevation.level4;
}

/** Android: avoid translucent stacks — one opaque fill that still respects caller intent. */
function resolveAndroidSolidBackground(
  style: ViewProps['style'],
  theme: 'light' | 'dark',
  slab: { lightFill: string; darkFill: string },
): string {
  const explicit = readBackgroundColor(style);
  if (explicit && explicit !== 'transparent') {
    if (explicit.startsWith('#')) {
      return withAlpha(explicit, 1);
    }
    if (explicit.startsWith('rgba') || explicit.startsWith('rgb(')) {
      return glassTint(explicit, 1);
    }
  }
  return theme === 'dark' ? slab.darkFill : slab.lightFill;
}

export interface GlassViewProps extends ViewProps {
  children?: React.ReactNode;
  /** Native-only glass effect configuration: 'thin' | 'regular' | 'thick' | 'ultraThin' */
  glassEffectStyle?: GlassStyle;
  colorScheme?: 'light' | 'dark';
  tone?: 'auto' | 'light' | 'dark';
  tintColor?: string;
  intensity?: number;
  bordered?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
}

/**
 * GlassView (Native implementation)
 * =================================
 *
 * Uses `expo-glass-effect` on iOS when available.
 * Fallback: iOS uses `expo-blur`. Android uses one opaque token fill (no blur / no layered frost).
 */
export function GlassView({
  children,
  style,
  glassEffectStyle = 'regular',
  colorScheme,
  tone = 'auto',
  tintColor,
  intensity,
  bordered = true,
  contentStyle,
  borderRadius,
  ...props
}: GlassViewProps) {
  const isDark = useIsDark();
  const colors = useColors();
  const [reduceTransparency, setReduceTransparency] = React.useState(false);

  React.useEffect(() => {
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency);
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then(setReduceTransparency)
      .catch(() => {});
    return () => sub.remove();
  }, []);

  const resolvedTone = tone === 'auto' ? undefined : tone;
  const theme = resolvedTone || colorScheme || (isDark ? 'dark' : 'light');
  const nativeLiquidGlass = Platform.OS === 'ios' && isGlassEffectAPIAvailable() && !reduceTransparency;

  const preset = theme === 'dark' ? glass.dark : glass.light;
  const backgroundColor = tintColor || preset.backgroundColor;
  const borderColor = bordered ? preset.borderColor : 'transparent';

  if (nativeLiquidGlass) {
    return (
      <ExpoGlassView
        {...props}
        glassEffectStyle={glassEffectStyle}
        colorScheme={theme}
        tintColor={backgroundColor}
        style={[
          {
            borderColor,
            borderWidth: bordered ? 1 : 0,
            borderRadius,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        {contentStyle ? <View style={[{ flex: 1 }, contentStyle]}>{children}</View> : children}
      </ExpoGlassView>
    );
  }

  // Fallback: iOS uses blur; Android uses a single opaque surface (no faux-glass stack).
  const blurIntensity = intensity || (Platform.OS === 'ios' ? LiquidGlassTokens.blurFallback.ios : LiquidGlassTokens.blurFallback.android);
  const { outer: outerSurfaceStyle, content: contentLayout } = splitGlassLayoutStyle(style);
  const innerVeil = glassTint(backgroundColor, 0.2);

  if (Platform.OS === 'android') {
    let solidBg = resolveAndroidSolidBackground(style, theme, {
      lightFill: colors.surface,
      darkFill: colors.surfaceElevated,
    });
    // Tonal container: honor tint when no explicit opaque background (M3 surface tint)
    const explicitBg = readBackgroundColor(style);
    if (!explicitBg || explicitBg === 'transparent') {
      const tintBase = backgroundColor;
      if (tintBase && typeof tintBase === 'string') {
        solidBg = glassTint(tintBase, theme === 'dark' ? 0.94 : 0.98);
      }
    }
    const androidBorderColor = bordered ? colors.borderLight : 'transparent';
    const elevationPx = androidElevationFromIntensity(intensity);
    return (
      <View
        {...props}
        style={[
          styles.fallbackContainer,
          { borderColor: androidBorderColor, borderWidth: bordered ? 1 : 0, borderRadius },
          outerSurfaceStyle,
          { backgroundColor: solidBg },
          styles.androidShell,
          { elevation: elevationPx },
        ]}
      >
        <View style={[contentLayout, styles.androidContentBg, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View
      {...props}
      style={[
        styles.fallbackContainer,
        { borderColor, borderWidth: bordered ? 1 : 0, borderRadius },
        outerSurfaceStyle,
      ]}
    >
      <BlurView intensity={blurIntensity} tint={theme} style={StyleSheet.absoluteFill} />
      <View style={[contentLayout, { backgroundColor: innerVeil }, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    overflow: 'hidden',
  },
  /** Base shell; per-instance elevation set dynamically from intensity (Material 3 Expressive). */
  androidShell: {},
  /** Outer + plate already carry tint; avoid stacking opaque veils on Android. */
  androidContentBg: {
    backgroundColor: 'transparent',
  },
});

export default GlassView;
