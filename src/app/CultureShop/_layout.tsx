import { Stack } from 'expo-router';
import { NavigationMetadata } from '@/components/NavigationMetadata';

export default function CultureShopLayout() {
  return (
    <>
      <NavigationMetadata />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="[id]" />
        <Stack.Screen name="list" />
        <Stack.Screen name="manage" />
      </Stack>
    </>
  );
}
