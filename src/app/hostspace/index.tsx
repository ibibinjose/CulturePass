import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import { HostspaceManagePanel } from '@/modules/host/screens/HostspaceManagePanel';
import { resolveHostspaceCreateRedirect } from '@/lib/hostspaceDeeplinks';
import { useColors } from '@/hooks/useColors';
import { Luxe } from '@/design-system/tokens/luxeHeritage';

/**
 * /hostspace — manage hub (default).
 * Legacy create query params redirect to canonical /hostspace/create/* routes.
 * Manage tabs deeplink via ?tab=pages|events|listings|offers|market
 */
export default function HostspaceIndexScreen() {
  const colors = useColors();
  const params = useLocalSearchParams();
  const createRedirect = resolveHostspaceCreateRedirect(params);

  useEffect(() => {
    if (!createRedirect) return;
    router.replace(createRedirect as never);
  }, [createRedirect]);

  if (createRedirect) {
    return (
      <View style={[s.redirecting, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Luxe.colors.indigo} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <HostspaceAccessGate intent="hub">
        <HostspaceManagePanel />
      </HostspaceAccessGate>
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  redirecting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});