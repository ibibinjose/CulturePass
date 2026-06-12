import React from 'react';
import { View, StyleSheet } from 'react-native';

import { DestinationStickyBar } from '@/components/city/DestinationStickyBar';
import {
  HostspaceManageTabs,
  type HostspaceManageTab,
} from '@/modules/host/components/HostspaceManageTabs';
import { useColors } from '@/hooks/useColors';

interface HostspaceManageStickyBarProps {
  hPad: number;
  activeTab: HostspaceManageTab;
  onTabChange: (tab: HostspaceManageTab) => void;
}

export function HostspaceManageStickyBar({ hPad, activeTab, onTabChange }: HostspaceManageStickyBarProps) {
  const colors = useColors();

  return (
    <DestinationStickyBar tone="legacy">
      <View style={[s.inner, { paddingHorizontal: hPad }]}>
        <HostspaceManageTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          colors={{ onSurface: colors.text, onSurfaceVariant: colors.textSecondary }}
        />
      </View>
    </DestinationStickyBar>
  );
}

const s = StyleSheet.create({
  inner: {
    paddingTop: 10,
    paddingBottom: 10,
  },
});