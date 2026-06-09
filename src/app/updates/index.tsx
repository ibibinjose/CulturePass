import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { modulesApi } from '@/modules/api';
import type { AppUpdate, UpdateCategory } from '@/modules/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens } from '@/design-system/tokens/theme';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { goBackOrReplace } from '@/lib/navigation';
import { formatShortDate } from '@/lib/format';
import { Skeleton } from '@/design-system/ui/Skeleton';
import * as Haptics from 'expo-haptics';

const CATEGORY_CONFIG: Record<UpdateCategory, { label: string; color: string; icon: string }> = {
  release: { label: 'Release', color: CultureTokens.indigo, icon: 'rocket-outline' },
  feature: { label: 'Feature', color: CultureTokens.teal, icon: 'sparkles-outline' },
  fix: { label: 'Fix', color: CultureTokens.coral, icon: 'construct-outline' },
  announcement: { label: 'Announcement', color: CultureTokens.gold, icon: 'megaphone-outline' },
  maintenance: { label: 'Maintenance', color: CultureTokens.coral, icon: 'build-outline' },
  community: { label: 'Community', color: CultureTokens.teal, icon: 'people-outline' },
};

function UpdatesListContent() {
  const colors = useColors();
  const { hPad } = useLayout();
  const safeInsets = useSafeAreaInsetsWeb();

  const { data, isLoading } = useQuery({
    queryKey: ['updates', 'list'],
    queryFn: () => modulesApi.updates.list({ limit: 50 }),
    staleTime: 60_000,
  });

  const updates = data?.updates ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: safeInsets.top + 16,
            paddingHorizontal: hPad,
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            goBackOrReplace('/(tabs)');
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {"What's New"}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingHorizontal: hPad, paddingBottom: safeInsets.bottom + 40 },
        ]}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <Skeleton width={90} height={22} borderRadius={8} />
                <Skeleton width="85%" height={20} borderRadius={6} style={{ marginTop: 12 }} />
                <Skeleton width="40%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
              </View>
            ))
          : null}

        {!isLoading && updates.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="newspaper-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No updates yet</Text>
          </View>
        ) : null}

        {updates.map((item: AppUpdate) => {
          const cat = CATEGORY_CONFIG[item.category as UpdateCategory] ?? CATEGORY_CONFIG.announcement;
          return (
            <Pressable
              key={item.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => router.push(`/updates/${item.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Open update ${item.title}`}
            >
              <View style={[styles.catBadge, { backgroundColor: cat.color + '18' }]}>
                <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={13} color={cat.color} />
                <Text style={[styles.catText, { color: cat.color }]}>{cat.label}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.cardMeta, { color: colors.textTertiary }]}>
                {item.publishedAt ? formatShortDate(item.publishedAt) : ''}
                {item.version ? `  ·  v${item.version}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function UpdatesListScreen() {
  return (
    <ErrorBoundary>
      <UpdatesListContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  list: { paddingTop: 20, gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  catText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontSize: 17, fontFamily: 'Poppins_600SemiBold', marginTop: 10, lineHeight: 24 },
  cardMeta: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 6 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Poppins_500Medium' },
});