import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { NavigationMetadata } from '@/components/NavigationMetadata';

export default function MembershipLayout() {
  return (
    <>
      <NavigationMetadata />
      <Stack
        screenOptions={{
          headerShown: false,
          headerShadowVisible: false,
          animation: Platform.OS === 'web' ? 'fade' : Platform.OS === 'ios' ? 'default' : 'slide_from_right',
          ...(Platform.OS === 'web'
            ? { contentStyle: { flex: 1, minHeight: 0 } }
            : {}),
        }}
      />
    </>
  );
}
