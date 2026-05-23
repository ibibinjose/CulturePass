/**
 * DraftRecoveryModal Example
 * 
 * This file demonstrates how to use the DraftRecoveryModal component
 * with various scenarios and configurations.
 * 
 * To view this example:
 * 1. Import this component in your app
 * 2. Render it in a screen
 * 3. Toggle the examples to see different states
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { DraftRecoveryModal } from './DraftRecoveryModal';
import type { ProfileDraft } from '@/platform/api/endpoints/createProfilesNamespace';
import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_DRAFTS: Record<string, ProfileDraft[]> = {
  single: [
    {
      id: 'draft-1',
      userId: 'user-1',
      entityType: 'community',
      formData: {
        name: 'Sydney Tamil Community',
      },
      currentStep: 3,
      completedSteps: [1, 2],
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 89 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  multiple: [
    {
      id: 'draft-1',
      userId: 'user-1',
      entityType: 'community',
      formData: {
        name: 'Sydney Tamil Community',
      },
      currentStep: 3,
      completedSteps: [1, 2],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 88 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'draft-2',
      userId: 'user-1',
      entityType: 'venue',
      formData: {
        name: 'The Grand Theatre',
      },
      currentStep: 5,
      completedSteps: [1, 2, 3, 4],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 89 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'draft-3',
      userId: 'user-1',
      entityType: 'business',
      formData: {
        name: 'Spice Market Restaurant',
      },
      currentStep: 2,
      completedSteps: [1],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 83 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  allTypes: [
    {
      id: 'draft-community',
      userId: 'user-1',
      entityType: 'community',
      formData: { name: 'Melbourne Indian Community' },
      currentStep: 2,
      completedSteps: [1],
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 89 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'draft-organiser',
      userId: 'user-1',
      entityType: 'organiser',
      formData: { name: 'Cultural Events Co' },
      currentStep: 3,
      completedSteps: [1, 2],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 88 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'draft-venue',
      userId: 'user-1',
      entityType: 'venue',
      formData: { name: 'Sydney Opera House' },
      currentStep: 4,
      completedSteps: [1, 2, 3],
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 87 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'draft-business',
      userId: 'user-1',
      entityType: 'business',
      formData: { name: 'Taj Mahal Restaurant' },
      currentStep: 5,
      completedSteps: [1, 2, 3, 4],
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 86 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'draft-artist',
      userId: 'user-1',
      entityType: 'artist',
      formData: { name: 'Ravi Kumar - Tabla Master' },
      currentStep: 6,
      completedSteps: [1, 2, 3, 4, 5],
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'draft-professional',
      userId: 'user-1',
      entityType: 'professional',
      formData: { name: 'Dr. Sarah Chen - Cultural Consultant' },
      currentStep: 1,
      completedSteps: [],
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

// ---------------------------------------------------------------------------
// Example Component
// ---------------------------------------------------------------------------

export function DraftRecoveryModalExample() {
  const colors = useColors();
  const [scenario, setScenario] = useState<keyof typeof MOCK_DRAFTS>('single');
  const [visible, setVisible] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);

  const handleSelectDraft = (draftId: string) => {
    setSelectedDraft(draftId);
    setAction('Selected draft');
    setVisible(false);
  };

  const handleStartFresh = () => {
    setSelectedDraft(null);
    setAction('Started fresh');
    setVisible(false);
  };

  const handleDismiss = () => {
    setAction('Dismissed');
    setVisible(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[TextStyles.title, { color: colors.text }]}>
        DraftRecoveryModal Examples
      </Text>

      <Text
        style={[
          TextStyles.body,
          { color: colors.textSecondary, marginTop: Spacing.sm },
        ]}
      >
        This component demonstrates the DraftRecoveryModal in various scenarios.
        Select a scenario and tap &quot;Show Modal&quot; to see it in action.
      </Text>

      {/* Scenario Selector */}
      <View style={styles.section}>
        <Text style={[TextStyles.title3, { color: colors.text }]}>
          Select Scenario
        </Text>

        <View style={styles.buttonGroup}>
          <ScenarioButton
            label="Single Draft"
            active={scenario === 'single'}
            onPress={() => setScenario('single')}
            colors={colors}
          />
          <ScenarioButton
            label="Multiple Drafts"
            active={scenario === 'multiple'}
            onPress={() => setScenario('multiple')}
            colors={colors}
          />
          <ScenarioButton
            label="All Entity Types"
            active={scenario === 'allTypes'}
            onPress={() => setScenario('allTypes')}
            colors={colors}
          />
        </View>
      </View>

      {/* Show Modal Button */}
      <Pressable
        style={[styles.showButton, { backgroundColor: colors.primary }]}
        onPress={() => setVisible(true)}
      >
        <Text style={[TextStyles.callout, { color: '#FFFFFF' }]}>
          Show Modal ({MOCK_DRAFTS[scenario].length} draft
          {MOCK_DRAFTS[scenario].length === 1 ? '' : 's'})
        </Text>
      </Pressable>

      {/* Result Display */}
      {action && (
        <View
          style={[
            styles.result,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[TextStyles.callout, { color: colors.text }]}>
            Last Action: {action}
          </Text>
          {selectedDraft && (
            <Text
              style={[
                TextStyles.caption,
                { color: colors.textSecondary, marginTop: Spacing.xs },
              ]}
            >
              Draft ID: {selectedDraft}
            </Text>
          )}
        </View>
      )}

      {/* Draft Details */}
      <View style={styles.section}>
        <Text style={[TextStyles.title3, { color: colors.text }]}>
          Current Scenario Details
        </Text>

        {MOCK_DRAFTS[scenario].map((draft, index) => (
          <View
            key={draft.id}
            style={[
              styles.draftDetail,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[TextStyles.callout, { color: colors.text }]}>
              Draft {index + 1}: {draft.entityType}
            </Text>
            <Text
              style={[
                TextStyles.caption,
                { color: colors.textSecondary, marginTop: Spacing.xs },
              ]}
            >
              Name: {draft.formData.name || 'Untitled'}
            </Text>
            <Text
              style={[
                TextStyles.caption,
                { color: colors.textSecondary, marginTop: Spacing.xs },
              ]}
            >
              Step: {draft.currentStep} / 6
            </Text>
            <Text
              style={[
                TextStyles.caption,
                { color: colors.textSecondary, marginTop: Spacing.xs },
              ]}
            >
              Completed: {draft.completedSteps.length} steps
            </Text>
          </View>
        ))}
      </View>

      {/* Modal */}
      <DraftRecoveryModal
        visible={visible}
        drafts={MOCK_DRAFTS[scenario]}
        onSelectDraft={handleSelectDraft}
        onStartFresh={handleStartFresh}
        onDismiss={handleDismiss}
      />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Scenario Button Component
// ---------------------------------------------------------------------------

interface ScenarioButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}

function ScenarioButton({
  label,
  active,
  onPress,
  colors,
}: ScenarioButtonProps) {
  return (
    <Pressable
      style={[
        styles.scenarioButton,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          TextStyles.caption,
          { color: active ? '#FFFFFF' : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginTop: Spacing.xl,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  scenarioButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  showButton: {
    marginTop: Spacing.xl,
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
    borderRadius: 50,
    alignItems: 'center',
  },
  result: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  draftDetail: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
});
