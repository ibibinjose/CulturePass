import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useSafeBack } from '@/lib/navigation';
import { MAIN_TAB_UI } from '@/modules/core/layout/tabs/mainTabTokens';
import { HeaderTokens, FontFamily, FontSize } from '@/design-system/tokens/theme';

interface BrowseHeaderProps {
  title: string;
  tagline?: string;
  accentColor: string;
  accentIcon: string;
}

export function BrowseHeader({ title, tagline, accentColor, accentIcon }: BrowseHeaderProps) {
  const m3Colors = useM3Colors();
  const goBack = useSafeBack('/');

  return (
    <View style={styles.header}>
      <Pressable
        onPress={goBack}
        style={({ pressed }) => [
          styles.backBtn, 
          { backgroundColor: m3Colors.surface, borderColor: m3Colors.outlineVariant },
          pressed && { backgroundColor: m3Colors.surfaceVariant }
        ]}
        hitSlop={12}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={22} color={m3Colors.onSurface} />
      </Pressable>
      <View style={styles.headerCenter}>
        <View style={[styles.headerIcon, { backgroundColor: accentColor + '15' }]}>
          <Ionicons name={accentIcon as keyof typeof Ionicons.glyphMap} size={18} color={accentColor} />
        </View>
        <View>
          <Text style={[styles.headerTitle, { color: m3Colors.onSurface }]}>{title}</Text>
          {tagline ? <Text style={[styles.headerTagline, { color: m3Colors.onSurfaceVariant }]}>{tagline}</Text> : null}
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.backBtn, 
          { backgroundColor: m3Colors.surface, borderColor: m3Colors.outlineVariant },
          pressed && { backgroundColor: m3Colors.surfaceVariant }
        ]}
        hitSlop={12}
        onPress={() => router.push('/search' as any)}
        accessibilityLabel="Search"
        accessibilityRole="button"
      >
        <Ionicons name="search-outline" size={22} color={m3Colors.onSurface} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    minHeight: HeaderTokens.height,
    paddingVertical: 6,
  },
  backBtn: {
    width: MAIN_TAB_UI.minTouchTarget,
    height: MAIN_TAB_UI.minTouchTarget,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    minWidth: 0,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: FontSize.title3,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.3,
  },
  headerTagline: {
    fontSize: FontSize.chip,
    fontFamily: FontFamily.regular,
    marginTop: 2,
    letterSpacing: -0.1,
  },
});
