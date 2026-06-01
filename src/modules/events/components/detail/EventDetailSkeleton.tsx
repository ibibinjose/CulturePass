import { View, ScrollView } from 'react-native';
import { useTopInset } from '@/hooks/useSafeAreaInsetsWeb';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Skeleton } from '@/design-system/ui/Skeleton';

export function EventDetailSkeleton() {
  const colors = useColors();
  const topInset = useTopInset();
  const { isDesktop } = useLayout();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Skeleton width="100%" height={isDesktop ? 450 : 380 + topInset} borderRadius={isDesktop ? 32 : 0} style={isDesktop && { margin: 20, alignSelf: 'center', width: '90%' }} />
        <View style={{ padding: 20, gap: 16 }}>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            marginVertical: 10,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}>
            <Skeleton width={120} height={20} borderRadius={10} />
            <Skeleton width="80%" height={32} borderRadius={10} style={{ marginVertical: 12 }} />
            <Skeleton width="100%" height={16} borderRadius={4} />
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
            <Skeleton width="48%" height={100} borderRadius={20} />
            <Skeleton width="48%" height={100} borderRadius={20} />
          </View>

          <Skeleton width="100%" height={120} borderRadius={20} style={{ marginTop: 12 }} />

          <View style={{ gap: 12, marginTop: 20 }}>
            {[1, 2].map(i => (
              <Skeleton key={i} width="100%" height={80} borderRadius={20} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default EventDetailSkeleton;
