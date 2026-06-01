import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CardTokens } from '@/design-system/tokens/theme';

interface ComingSoonRailProps {
  title: string;
  subtitle?: string;
  icon: string;
  accentColor: string;
  cardCount?: number;
}

function ComingSoonRailComponent({
  title,
  subtitle,
  icon,
  accentColor,
  cardCount = 4,
}: ComingSoonRailProps) {
  const colors = useColors();
  const { hPad } = useLayout();

  const placeholders = Array.from({ length: cardCount }, (_, i) => i);

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={[styles.comingSoonBadge, { backgroundColor: accentColor + '18' }]}>
          <Text style={[styles.comingSoonText, { color: accentColor }]}>Coming Soon</Text>
        </View>
      </View>

      {/* Placeholder card row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: hPad }]}
      >
        {placeholders.map((i) => (
          <View
            key={i}
            style={[
              styles.placeholderCard,
              {
                backgroundColor: colors.surface,
                borderColor: accentColor + '40',
                ...Platform.select({
                  ios: {
                    shadowColor: accentColor,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                  },
                  android: { elevation: 4 },
                  web: { boxShadow: `0px 4px 12px ${accentColor}25` } as any
                })
              },
            ]}
          >
            <LinearGradient
              colors={[accentColor + '30', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons
              name={icon as React.ComponentProps<typeof Ionicons>['name']}
              size={32}
              color={accentColor}
            />
            <Text style={[styles.cardLabel, { color: colors.textTertiary }]}>
              Coming Soon
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
    marginTop: 2,
  },
  comingSoonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  comingSoonText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  scrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  placeholderCard: {
    width: 160,
    height: 200,
    borderRadius: CardTokens.radius,
    borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
});

export const ComingSoonRail = React.memo(ComingSoonRailComponent);
