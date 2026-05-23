import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { modulesApi } from '@/modules/api';
import type { User, EventData } from '@/shared/schema';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useIsDark } from '@/hooks/useColors';
import { TextStyles } from '@/design-system/tokens/typography';
import { CultureTokens } from '@/design-system/tokens/theme';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/design-system/ui/Button';
import { Card } from '@/design-system/ui/Card';

export default function OrganiserProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const s = getStyles(colors);

  const { data: organiser, isLoading: loadingOrg } = useQuery<User>({
    queryKey: ['/api/users', id],
    queryFn: () => modulesApi.users.get(id) as Promise<User>,
    enabled: !!id,
  });

  const { data: eventsRes, isLoading: loadingEvents } = useQuery({
    queryKey: ['/api/events', { organizerId: id }],
    queryFn: () => modulesApi.events.list({ organizerId: id, pageSize: 20 }),
    enabled: !!id,
  });

  const events = eventsRes?.events || [];

  if (loadingOrg || loadingEvents) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={CultureTokens.indigo} />
      </View>
    );
  }

  if (!organiser) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Organiser not found</Text>
        <Button variant="outline" onPress={() => router.back()} style={{ marginTop: 20 }}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.headerBar}>
        <Button variant="ghost" size="sm" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Button>
        <Text style={[TextStyles.headline, { color: colors.text }]}>Organiser Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Profile Header */}
        <View style={s.profileHeader}>
          <Image
            source={organiser.avatarUrl ? { uri: organiser.avatarUrl } : null}
            style={s.avatar}
            contentFit="cover"
          />
          <Text style={[TextStyles.title, { color: colors.text, marginTop: 16 }]}>
            {organiser.displayName || organiser.username || 'Organiser'}
          </Text>
          <Text style={[TextStyles.bodyMedium, { color: colors.textSecondary }]}>
            @{organiser.handle || organiser.username}
          </Text>

          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={[TextStyles.title2, { color: colors.text }]}>{eventsRes?.total || 0}</Text>
              <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>Events</Text>
            </View>
            <View style={s.statBox}>
              <Text style={[TextStyles.title2, { color: colors.text }]}>{organiser.isSydneyVerified ? 'Yes' : 'No'}</Text>
              <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>Verified</Text>
            </View>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.section}>
          <Text style={[TextStyles.headline, { color: colors.text, marginBottom: 12 }]}>Hosted Events</Text>
          {events.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }}>
              No upcoming events.
            </Text>
          ) : (
            <View style={s.eventGrid}>
              {events.map((ev: EventData) => (
                <Card
                  key={ev.id}
                  glass={!isDark}
                  padding={16}
                  style={s.eventCard}
                  onPress={() => router.push({ pathname: '/e/[id]', params: { id: ev.id } })}
                >
                  <Image source={{ uri: ev.imageUrl }} style={s.eventImage} contentFit="cover" />
                  <View style={s.eventInfo}>
                    <Text style={[TextStyles.headline, { color: colors.text }]} numberOfLines={1}>{ev.title}</Text>
                    <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                      {ev.date}
                    </Text>
                    <Text style={[TextStyles.captionSemibold, { color: CultureTokens.indigo, marginTop: 8 }]}>
                      {ev.priceCents && ev.priceCents > 0 ? `$${(ev.priceCents / 100).toFixed(2)}` : 'Free'}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: colors.borderLight,
  },
  profileHeader: { alignItems: 'center', padding: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surfaceElevated },
  statsRow: { flexDirection: 'row', marginTop: 24, paddingHorizontal: 20, gap: 40 },
  statBox: { alignItems: 'center' },
  divider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: 24 },
  section: { padding: 24 },
  eventGrid: { gap: 16 },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  eventImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: colors.backgroundSecondary },
  eventInfo: { flex: 1, justifyContent: 'center' },
});
