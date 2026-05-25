import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

function UpdateDetailContent() {
  const colors = useColors();
  const { hPad } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: update, isLoading } = useQuery<AppUpdate>({
    queryKey: ['update', id],
    queryFn: () => modulesApi.updates.get(id),
    enabled: !!id,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 16, paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
          <Pressable style={styles.backBtn} onPress={() => goBackOrReplace('/updates/index')} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        </View>
        <View style={[styles.content, { paddingHorizontal: hPad }]}>
          <View style={styles.metaRow}>
            <Skeleton width={80} height={24} borderRadius={8} />
            <Skeleton width={60} height={24} borderRadius={8} />
          </View>
          <Skeleton width="90%" height={32} borderRadius={8} style={{ marginBottom: 16 }} />
          <Skeleton width="40%" height={16} borderRadius={4} style={{ marginBottom: 24 }} />
          <View style={{ height: 1, backgroundColor: colors.borderLight, marginBottom: 24 }} />
          <View style={{ gap: 12 }}>
            {[100, 100, 95, 100, 100, 80].map((w, i) => (
              <Skeleton key={i} width={`${w}%`} height={16} borderRadius={4} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (!update) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 16, paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
          <Pressable style={styles.backBtn} onPress={() => goBackOrReplace('/updates/index')} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Not Found</Text>
        </View>
        <View style={styles.loadingState}>
          <Ionicons name="newspaper-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>This post no longer exists</Text>
        </View>
      </View>
    );
  }

  const cat = CATEGORY_CONFIG[update.category as UpdateCategory] ?? CATEGORY_CONFIG.announcement;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 16, paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            goBackOrReplace('/updates/index');
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{"What's New"}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 40 }]}
      >
        <View style={styles.metaRow}>
          <View style={[styles.catBadge, { backgroundColor: cat.color + '18' }]}>
            <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={13} color={cat.color} />
            <Text style={[styles.catText, { color: cat.color }]}>{cat.label}</Text>
          </View>
          {update.version && (
            <View style={[styles.versionPill, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.versionText, { color: colors.textSecondary }]}>v{update.version}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{update.title}</Text>

        <View style={styles.byline}>
          <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
          <Text style={[styles.bylineText, { color: colors.textTertiary }]}>
            {update.publishedAt ? formatShortDate(update.publishedAt, { day: 'numeric', month: 'long', year: 'numeric' }) : ''}{update.authorName ? `  ·  ${update.authorName}` : ''}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

        <Text style={[styles.body, { color: colors.text }]}>{update.body}</Text>
      </ScrollView>
    </View>
  );
}

export default function UpdateDetailScreen() {
  return (
    <ErrorBoundary>
      <UpdateDetailContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.4)' },
      default: {},
    }),
  },
  backBtn:      { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  headerTitle:  { flex: 1, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText:    { fontSize: 15, fontFamily: 'Poppins_500Medium' },
  content:      { paddingTop: 24 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  catBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  catText:      { fontSize: 12, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  versionPill:  { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7 },
  versionText:  { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  title:        { fontSize: 24, fontFamily: 'Poppins_700Bold', lineHeight: 32, marginBottom: 10 },
  byline:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  bylineText:   { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  divider:      { height: 1, marginBottom: 20 },
  body:         { fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 26 },
});
