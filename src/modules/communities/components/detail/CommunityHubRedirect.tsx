import { useEffect } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useColors } from '@/hooks/useColors';

type Props = {
  href: string;
  label?: string;
};

export function CommunityHubRedirect({
  href,
  label = 'Redirecting to the Community Hub...',
}: Props) {
  const colors = useColors();

  useEffect(() => {
    const redirect = () => {
      router.replace(href as never);
    };

    if (Platform.OS === 'web') {
      const handle = requestAnimationFrame(redirect);
      return () => cancelAnimationFrame(handle);
    }

    redirect();
    return undefined;
  }, [href]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: colors.background,
        paddingHorizontal: 24,
      }}
    >
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

export default CommunityHubRedirect;
