import { Stack } from 'expo-router';
import { NavigationMetadata } from '@/components/NavigationMetadata';

export default function CultureMarketLayout() {
  return (
    <>
      <NavigationMetadata />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="[id]" />
        <Stack.Screen name="list" />
      </Stack>
    </>
  );
}
