import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily, Radius, SignatureGradient } from '@/design-system/tokens/theme';

export type ContactsSegment = 'all' | 'pinned' | 'notes';

type SegmentDef = {
  key: ContactsSegment;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  count: number;
};

type Props = {
  segment: ContactsSegment;
  onSegmentChange: (s: ContactsSegment) => void;
  segments: SegmentDef[];
};

export function ContactsSegmentTabs({ segment, onSegmentChange, segments }: Props) {
  const colors = useColors();

  return (
    <View style={[styles.track, { backgroundColor: colors.backgroundSecondary }]}>
      {segments.map(({ key, label, icon, count }) => {
        const active = segment === key;
        return (
          <Pressable
            key={key}
            onPress={() => onSegmentChange(key)}
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
            <Ionicons name={icon} size={16} color={active ? '#FFF' : colors.textTertiary} />
            <Text
              style={[
                styles.label,
                { color: active ? '#FFF' : colors.textSecondary },
                active && { fontFamily: FontFamily.bold },
              ]}
            >
              {label}
            </Text>
            {count > 0 ? (
              <View style={[styles.badge, active && styles.badgeActive]}>
                <Text style={[styles.badgeText, { color: active ? '#FFF' : colors.textTertiary }]}>
                  {count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
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
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Platform.select({ web: { cursor: 'pointer' } as Record<string, unknown>, default: {} }),
  },
  tabActive: {
    ...Platform.select({
      ios: {
        shadowColor: CultureTokens.violet,
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 3 },
      web: { boxShadow: `0 3px 12px ${CultureTokens.violet}40` } as Record<string, unknown>,
    }),
  },
  label: { fontSize: 13, fontFamily: FontFamily.semibold },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  badgeText: { fontSize: 11, fontFamily: FontFamily.bold },
});
