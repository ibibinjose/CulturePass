import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EventData } from '@shared/schema';
import WebEventRailCard from './WebEventRailCard';
import { useColors } from '@/hooks/useColors';

interface WebRailSectionProps {
  title: string;
  subtitle?: string;
  events: EventData[];
  onSeeAll?: () => void;
}

export default function WebRailSection({
  title,
  subtitle,
  events,
  onSeeAll,
}: WebRailSectionProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  if (events.length === 0) return null;
  return (
    <View style={styles.webSection}>
      <View style={styles.webSectionHeader}>
        <View style={styles.webSectionTitleRow}>
          <View>
            <Text style={styles.webSectionTitle}>{title}</Text>
            {subtitle ? <Text style={styles.webSectionSub}>{subtitle}</Text> : null}
          </View>
        </View>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} style={styles.webSeeAllBtn}>
            <Text style={styles.webSeeAllText}>See all</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.webRailScroll}>
        {events.map((event) => (
          <WebEventRailCard key={event.id} event={event} />
        ))}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  webSection: {
    gap: 16,
  },
  webSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  webSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  webSectionTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    letterSpacing: -0.5,
  },
  webSectionSub: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
  },
  webSeeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceElevated,
  },
  webSeeAllText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textSecondary,
  },
  webRailScroll: {
    gap: 14,
    paddingBottom: 2,
  },
});
