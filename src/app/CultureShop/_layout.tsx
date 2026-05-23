import { Stack } from 'expo-router';

export default function CultureShopLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="list" />
      <Stack.Screen name="manage" />
    </Stack>
  );
}
