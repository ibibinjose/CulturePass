import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { EventAnalyticsDashboard } from '@/modules/events/components/EventAnalyticsDashboard';
import { useColors, useIsDark } from '@/hooks/useColors';
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';
import { LinearGradient } from 'expo-linear-gradient';

export default function EventAnalyticsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const colors = useColors();
  const isDark = useIsDark();

  if (!eventId) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <LinearGradient
        colors={isDark ? ['#0C0A09', '#1C1917'] : ['#FAF9F6', '#F5F1EE']}
        style={StyleSheet.absoluteFill}
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
