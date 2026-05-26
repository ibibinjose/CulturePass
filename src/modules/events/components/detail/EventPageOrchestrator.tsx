import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useM3Colors } from '@/hooks/useM3Colors';
import { Spacing } from '@/design-system/tokens/theme';

interface EventPageOrchestratorProps {
  isDesktop: boolean;
  bottomInset: number;
  mainContent: React.ReactNode;
  sidebarContent?: React.ReactNode;
  s: Record<string, unknown>;
}

export function EventPageOrchestrator({
  isDesktop,
  bottomInset,
  mainContent,
  sidebarContent,
}: EventPageOrchestratorProps) {
  const m3Colors = useM3Colors();

  if (isDesktop) {
    return (
      <View style={[styles.desktopContainer, { backgroundColor: m3Colors.background }]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.desktopContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainCol}>{mainContent}</View>
          {sidebarContent ? (
            <View style={styles.sidebarCol}>{sidebarContent}</View>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: m3Colors.background }}
      contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {mainContent}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  desktopContent: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 1280,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    gap: Spacing.xl,
  },
  mainCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: Spacing.lg,
  },
  sidebarCol: {
    width: 380,
    gap: Spacing.lg,
  },
});