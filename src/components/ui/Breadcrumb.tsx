/**
 * Breadcrumb — web navigation breadcrumb trail.
 *
 * Shown below the page header when the user is more than 2 levels deep
 * from the tab root on desktop (≥1024px). Collapses deep paths with an
 * ellipsis control (Req 11.3).
 *
 * Uses generateBreadcrumbs() from breadcrumb-utils.ts.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { generateBreadcrumbs } from '@/lib/breadcrumb-utils';
import { useM3Colors } from '@/hooks/useM3Colors';
import { FontFamily } from '@/design-system/tokens/theme';

interface BreadcrumbProps {
  /** Ordered navigation path from tab root to current screen. */
  path: string[];
  /** Label map: path segment → human-readable label. Falls back to segment itself. */
  labels?: Record<string, string>;
}

export default function Breadcrumb({ path, labels = {} }: BreadcrumbProps) {
  const m3 = useM3Colors();

  // Only render on web, and only when >2 levels deep (Req 11.3)
  if (Platform.OS !== 'web' || path.length <= 2) return null;

  const segments = generateBreadcrumbs(path, 5);

  return (
    <View style={styles.row} accessibilityRole="none">
      {segments.map((segment, idx) => {
        const isLast = idx === segments.length - 1;
        const label = labels[segment.route] ?? segment.label;

        return (
          <React.Fragment key={segment.route + idx}>
            {segment.isEllipsis ? (
              <Text style={[styles.ellipsis, { color: m3.onSurfaceVariant }]}>…</Text>
            ) : isLast ? (
              <Text
                style={[styles.current, { color: m3.onSurface }]}
                numberOfLines={1}
                accessibilityLabel={`Current page: ${label}`}
              >
                {label}
              </Text>
            ) : (
              <Pressable
                onPress={() => router.push(segment.route as Parameters<typeof router.push>[0])}
                style={styles.link}
                accessibilityRole="link"
                accessibilityLabel={`Go to ${label}`}
              >
                <Text style={[styles.linkText, { color: m3.primary }]} numberOfLines={1}>
                  {label}
                </Text>
              </Pressable>
            )}

            {!isLast && (
              <Ionicons
                name="chevron-forward"
                size={12}
                color={m3.onSurfaceVariant}
                style={styles.separator}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 2,
  },
  link: {
    maxWidth: 160,
  },
  linkText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  current: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    maxWidth: 200,
  },
  ellipsis: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    paddingHorizontal: 2,
  },
  separator: {
    marginHorizontal: 2,
  },
});
