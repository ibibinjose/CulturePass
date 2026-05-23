import React from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { LiquidGlassTokens, glass as glassPresets } from '@/design-system/tokens/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import { withAlpha } from '@/lib/withAlpha';

export interface GlassViewProps extends ViewProps {
  /** Optional tint color for the glass surface */
  tintColor?: string;
  /** Blur intensity (px) on web. Defaults to `LiquidGlassTokens.web.blurPx`. */
  intensity?: number;
  /** Whether to show a 1px hairline border */
  bordered?: boolean;
  /** Force a color scheme */
  colorScheme?: 'light' | 'dark';
  /** Optional content wrapper style for inner container */
  contentStyle?: StyleProp<ViewStyle>;
  /** Optional override for outer radius */
  borderRadius?: number;
  /** Theme tone alias: auto resolves from current theme */
  tone?: 'auto' | 'light' | 'dark';
  /** Native-only glass effect configuration (no-op on web) */
  glassEffectStyle?: string;
}

/**
 * GlassView (Web implementation)
 * ==============================
 *
 * Three-layer composition:
 *   1. Solid token surface fill at `web.supportsFallbackOpacity` — renders identically
 *      with or without `backdrop-filter` support, so Firefox-on-Linux (no backdrop-filter)
 *      and Safari/Chrome (with) both look acceptable.
 *   2. `backdrop-filter: blur(web.blurPx) saturate(web.saturation%)` layered on top —
 *      adds depth where the browser can do it; harmlessly ignored elsewhere.
 *   3. Hairline border via `colors.borderLight`.
 *
 * Why not the old 44px blur: too aggressive (perf cost on lower-end web; visible
 * banding on lower DPIs) and conditional on backdrop-filter support, so unsupported
 * browsers fell back to a near-transparent rgba and looked broken.
 */
export function GlassView({
  children,
  style,
  intensity,
  colorScheme,
  contentStyle,
  borderRadius,
  tone = 'auto',
  tintColor,
  bordered = true,
  ...props
}: GlassViewProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const resolvedTone = tone === 'auto' ? undefined : tone;
  const theme = resolvedTone || colorScheme || (isDark ? 'dark' : 'light');

  const blurPx = intensity ?? LiquidGlassTokens.web.blurPx;
  const saturation = LiquidGlassTokens.web.saturation;
  const fallbackAlpha = LiquidGlassTokens.web.supportsFallbackOpacity;

  const surfaceBase = theme === 'dark' ? colors.surfaceElevated : colors.surface;
  const tintBase = tintColor || surfaceBase;
  const fill = withAlpha(tintBase, fallbackAlpha);

  const preset = theme === 'dark' ? glassPresets.dark : glassPresets.light;
  const borderColor = bordered ? colors.borderLight || preset.borderColor : 'transparent';

  const webStyle = {
    backgroundColor: fill,
    borderColor,
    borderWidth: bordered ? 1 : 0,
    borderRadius,
    overflow: 'hidden',
    backdropFilter: `blur(${blurPx}px) saturate(${saturation}%)`,
    WebkitBackdropFilter: `blur(${blurPx}px) saturate(${saturation}%)`,
  } as unknown as ViewProps['style'];

  return (
    <View {...props} style={[webStyle, style]}>
      {contentStyle ? <View style={[{ flex: 1 }, contentStyle]}>{children}</View> : children}
    </View>
  );
}

export default GlassView;
