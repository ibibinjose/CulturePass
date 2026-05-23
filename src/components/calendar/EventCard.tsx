import { View, Text, StyleSheet } from 'react-native';
import { CultureImage } from '@/design-system/ui/CultureImage';
import { EventPublisherLine } from '@/modules/events/components/list/EventPublisherLine';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CardTokens, CultureTokens, TextStyles } from '@/design-system/tokens/theme';
import { formatEventDateTime } from '@/lib/dateUtils';
import type { EventData } from '@/shared/schema';

interface Props {
  event: EventData;
}

export default function EventCard({ event }: Props) {
  const colors = useColors();

  const dateLabel = formatEventDateTime(event.date, event.time);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {event.imageUrl ? (
        <CultureImage uri={event.imageUrl} style={styles.image} contentFit="cover" recyclingKey={`calendar-event-${event.id}`} />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.primaryGlow }]}>
          <Ionicons name="calendar" size={28} color={colors.primary} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={[TextStyles.eventCardTitle, { color: colors.text }]} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={12} color={colors.eventDate} />
          <Text style={[TextStyles.eventCardDate, { color: colors.eventDate }]} numberOfLines={1}>
            {dateLabel}
          </Text>
        </View>

        {event.venue ? (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
              {event.venue}
            </Text>
          </View>
        ) : null}

        {event.publisherProfileId ? (
          <View style={styles.publisherWrap}>
            <EventPublisherLine profileId={event.publisherProfileId} />
          </View>
        ) : null}

        <View style={styles.badgeRow}>
          {event.isFeatured && (
            <View style={[styles.badge, { backgroundColor: CultureTokens.violet + '22' }]}>
              <Ionicons name="star" size={10} color={CultureTokens.violet} />
              <Text style={[styles.badgeText, { color: CultureTokens.violet }]}>Featured</Text>
            </View>
          )}
          {event.isFree && (
            <View style={[styles.badge, { backgroundColor: CultureTokens.teal + '22' }]}>
              <Text style={[styles.badgeText, { color: CultureTokens.teal }]}>Free</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: CardTokens.radius,
    marginBottom: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.06)' as any,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    ...TextStyles.caption,
    flex: 1,
  },
  publisherWrap: {
    marginTop: -4,
    marginBottom: -6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
});
