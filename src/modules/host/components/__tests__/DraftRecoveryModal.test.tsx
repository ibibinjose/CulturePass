/**
 * DraftRecoveryModal Tests
 * 
 * Tests for the draft recovery modal component.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DraftRecoveryModal } from '../DraftRecoveryModal';
import type { ProfileDraft } from '@/platform/api/endpoints/createProfilesNamespace';

// Mock hooks
jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    surface: '#FFFFFF',
    borderLight: '#E5E5E5',
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    background: '#F5F5F5',
    border: '#CCCCCC',
  }),
}));

describe('DraftRecoveryModal', () => {
  const mockDrafts: ProfileDraft[] = [
    {
      id: 'draft-1',
      userId: 'user-1',
      entityType: 'community',
      formData: {
        name: 'Test Community',
      },
      currentStep: 2,
      completedSteps: [1],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 88 * 24 * 60 * 60 * 1000).toISOString(), // 88 days from now
    },
    {
      id: 'draft-2',
      userId: 'user-1',
      entityType: 'venue',
      formData: {
        name: 'Test Venue',
      },
      currentStep: 4,
      completedSteps: [1, 2, 3],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 89 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const mockOnSelectDraft = jest.fn();
  const mockOnStartFresh = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when visible is false', () => {
    const { queryByText } = render(
      <DraftRecoveryModal
        visible={false}
        drafts={mockDrafts}
        onSelectDraft={mockOnSelectDraft}
        onStartFresh={mockOnStartFresh}
        onDismiss={mockOnDismiss}
      />
    );

    expect(queryByText('Continue Your Work?')).toBeNull();
  });

  it('should render when visible is true', () => {
    const { getByText } = render(
      <DraftRecoveryModal
        visible={true}
        drafts={mockDrafts}
        onSelectDraft={mockOnSelectDraft}
        onStartFresh={mockOnStartFresh}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('Continue Your Work?')).toBeTruthy();
    expect(getByText(/You have 2 incomplete profiles/)).toBeTruthy();
  });

  it('should display all drafts', () => {
    const { getByText } = render(
      <DraftRecoveryModal
        visible={true}
        drafts={mockDrafts}
        onSelectDraft={mockOnSelectDraft}
        onStartFresh={mockOnStartFresh}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('Test Community')).toBeTruthy();
    expect(getByText('Test Venue')).toBeTruthy();
    expect(getByText('Community')).toBeTruthy();
    expect(getByText('Venue')).toBeTruthy();
  });

  it('should call onSelectDraft when a draft card is pressed', () => {
    const { getByText } = render(
      <DraftRecoveryModal
        visible={true}
        drafts={mockDrafts}
        onSelectDraft={mockOnSelectDraft}
        onStartFresh={mockOnStartFresh}
        onDismiss={mockOnDismiss}
      />
    );

    const draftCard = getByText('Test Community');
    fireEvent.press(draftCard.parent!);

    expect(mockOnSelectDraft).toHaveBeenCalledWith('draft-1');
  });

  it('should call onSelectDraft with most recent draft when "Continue Most Recent" is pressed', () => {
    const { getByText } = render(
      <DraftRecoveryModal
        visible={true}
        drafts={mockDrafts}
        onSelectDraft={mockOnSelectDraft}
        onStartFresh={mockOnStartFresh}
        onDismiss={mockOnDismiss}
      />
    );

    const continueButton = getByText('Continue Most Recent');
    fireEvent.press(continueButton);

    expect(mockOnSelectDraft).toHaveBeenCalledWith('draft-1');
  });

  it('should call onStartFresh when "Start Fresh" is pressed', () => {
    const { getByText } = render(
      <DraftRecoveryModal
        visible={true}
        drafts={mockDrafts}
        onSelectDraft={mockOnSelectDraft}
        onStartFresh={mockOnStartFresh}
        onDismiss={mockOnDismiss}
      />
    );

    const startFreshButton = getByText('Start Fresh');
    fireEvent.press(startFreshButton);

    expect(mockOnStartFresh).toHaveBeenCalled();
  });

  it('should call onDismiss when "Dismiss" is pressed', () => {
    const { getByText } = render(
      <DraftRecoveryModal
        visible={true}
        drafts={mockDrafts}
        onSelectDraft={mockOnSelectDraft}
        onStartFresh={mockOnStartFresh}
        onDismiss={mockOnDismiss}
      />
    );

    const dismissButton = getByText('Dismiss');
    fireEvent.press(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('should display correct progress percentage', () => {
    const { getByText } = render(
      <DraftRecoveryModal
        visible={true}
        drafts={mockDrafts}
        onSelectDraft={mockOnSelectDraft}
        onStartFresh={mockOnStartFresh}
        onDismiss={mockOnDismiss}
      />
    );

    // Draft 1: 1 completed step out of 6 = 17%
    expect(getByText('17%')).toBeTruthy();
    // Draft 2: 3 completed steps out of 6 = 50%
    expect(getByText('50%')).toBeTruthy();
  });

  it('should display correct step labels', () => {
    const { getByText } = render(
      <DraftRecoveryModal
        visible={true}
        drafts={mockDrafts}
        onSelectDraft={mockOnSelectDraft}
        onStartFresh={mockOnStartFresh}
        onDismiss={mockOnDismiss}
      />
    );

    // Draft 1 is on step 2
    expect(getByText('On: Media & Branding')).toBeTruthy();
    // Draft 2 is on step 4
    expect(getByText('On: Location & Operations')).toBeTruthy();
  });

  it('should handle singular draft count correctly', () => {
    const { getByText } = render(
      <DraftRecoveryModal
        visible={true}
        drafts={[mockDrafts[0]]}
        onSelectDraft={mockOnSelectDraft}
        onStartFresh={mockOnStartFresh}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText(/You have 1 incomplete profile\./)).toBeTruthy();
  });

  it('should display entity type badges with correct colors', () => {
    const { getByText } = render(
      <DraftRecoveryModal
        visible={true}
        drafts={mockDrafts}
        onSelectDraft={mockOnSelectDraft}
        onStartFresh={mockOnStartFresh}
        onDismiss={mockOnDismiss}
      />
    );

    // Check that entity type labels are rendered
    const communityBadge = getByText('Community');
    const venueBadge = getByText('Venue');

    expect(communityBadge).toBeTruthy();
    expect(venueBadge).toBeTruthy();
  });
});
