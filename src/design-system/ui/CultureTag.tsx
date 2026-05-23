import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextProps, type ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { FontSize, Radius } from '@/design-system/tokens/theme';

type CultureTagProps = TextProps & { children?: React.ReactNode };

export function CultureTag({ children, style, ...rest }: CultureTagProps) {
  const colors = useColors();
  return (
    <Text style={[styles.tag, { color: colors.textSecondary }, style]} {...rest}>
      {children}
    </Text>
  );
}

/** Split a single string where multiple kebab-case tags were joined with spaces (legacy data). */
function expandMultiSlugTokens(raw: string): string[] {
  const s = raw.trim();
  if (!s) return [];
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length > 1 && parts.every((p) => /-/.test(p))) {
    return parts;
  }
  return [s];
}

/** Flatten an array of tag strings; each entry may expand into multiple tokens. */
export function flattenCultureTagsList(tags: unknown): string[] {
  if (tags == null) return [];
  if (!Array.isArray(tags)) return [];
  const out: string[] = [];
  for (const item of tags) {
    if (typeof item !== 'string') continue;
    const s = item.trim();
    if (!s) continue;
    out.push(...expandMultiSlugTokens(s));
  }
  return out;
}

/**
 * Merge `cultureTag` + `cultureTags` from Firestore (handles string vs array and joined slugs).
 */
export function mergeCultureTagFields(cultureTag?: unknown, cultureTags?: unknown): string[] {
  const left = Array.isArray(cultureTag)
    ? flattenCultureTagsList(cultureTag)
    : typeof cultureTag === 'string' && cultureTag.trim()
      ? expandMultiSlugTokens(cultureTag)
      : [];
  const right = Array.isArray(cultureTags)
    ? flattenCultureTagsList(cultureTags)
    : typeof cultureTags === 'string' && cultureTags.trim()
      ? expandMultiSlugTokens(cultureTags)
      : [];
  return Array.from(new Set([...left, ...right]));
}

/** Human-readable label for kebab-case / slug tags on cards. */
export function formatCultureTagLabel(tag: string): string {
  const s = tag.trim().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').toLowerCase();
  if (!s) return '';
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CultureTagRow({
  tags = [],
  max = 2,
  style,
}: {
  tags?: string[];
  max?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const safe = React.useMemo(() => flattenCultureTagsList(tags), [tags]);
  const visible = safe.slice(0, Math.max(0, max));
  const hidden = Math.max(0, safe.length - visible.length);

  return (
    <View style={[styles.row, style]}>
      {visible.map((tag, i) => (
        <View
          key={`${i}-${tag}`}
          style={[
            styles.pill,
            {
              borderColor: colors.borderLight,
              backgroundColor: colors.surfaceElevated,
            },
          ]}
        >
          <Text style={[styles.pillText, { color: colors.textSecondary }]}>
            {formatCultureTagLabel(tag)}
          </Text>
        </View>
      ))}
      {hidden > 0 ? (
        <Text style={[styles.overflow, { color: colors.textTertiary }]}>+{hidden}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    fontSize: FontSize.caption,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 10,
  },
  overflow: {
    fontSize: 10,
  },
});

export default CultureTag;
