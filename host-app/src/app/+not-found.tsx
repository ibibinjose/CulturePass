import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { M3Typography, FontFamily } from '@/design-system/tokens/theme';

export default function NotFoundScreen() {
  const colors = useColors();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>404 — Page not found</Text>
        <Link href="/(tabs)" style={[styles.link, { color: colors.primary }]}>
          Back to Dashboard
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  title: { ...M3Typography.titleLarge, fontFamily: FontFamily.semibold },
  link: { ...M3Typography.bodyLarge },
});
