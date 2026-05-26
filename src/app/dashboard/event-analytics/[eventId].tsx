import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { EventAnalyticsDashboard } from '@/modules/events/components/EventAnalyticsDashboard';
import { useColors } from '@/hooks/useColors';
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';

export default function EventAnalyticsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const colors = useColors();

  if (!eventId) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <M3TopAppBar
        title="Event Analytics"
        onBack={() => router.back()}
        variant="medium"
      />
      <EventAnalyticsDashboard eventId={eventId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
