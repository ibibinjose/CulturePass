/**
 * Page Pro Wizard — Directors & executive members step
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import { M3FilterChip, M3Button } from '@/design-system/ui';
import { M3Typography } from '@/design-system/tokens/typography';
import { Spacing, Radius } from '@/design-system/tokens/theme';
import type { HostPageFormData, HostPageExecutiveMember, HostPageExecutiveRole } from '@/shared/schema';
import type { HostEntityType } from '@/shared/schema/hostTypes';
import { hostPageRequiresExecutiveMembers } from '@/shared/schema/hostPage';
import { WizardFormSection } from './WizardFormSection';

const ROLE_OPTIONS: { value: HostPageExecutiveRole; label: string }[] = [
  { value: 'director', label: 'Director' },
  { value: 'executive', label: 'Executive' },
  { value: 'chair', label: 'Chair' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'other', label: 'Other' },
];

export interface PageWizardLeadershipStepProps {
  entityType: HostEntityType;
  formData: HostPageFormData;
  updateFormData: (patch: Partial<HostPageFormData>) => void;
  getFieldError: (field: string) => string | undefined;
}

export function PageWizardLeadershipStep({
  entityType,
  formData,
  updateFormData,
  getFieldError,
}: PageWizardLeadershipStepProps) {
  const colors = useM3Colors();
  const required = hostPageRequiresExecutiveMembers(entityType);
  const members = formData.executiveMembers ?? [];

  const [draft, setDraft] = React.useState<HostPageExecutiveMember>({
    fullName: '',
    role: 'director',
    title: '',
    email: '',
  });

  const addMember = useCallback(() => {
    if (!draft.fullName.trim()) return;
    updateFormData({
      executiveMembers: [
        ...members,
        {
          fullName: draft.fullName.trim(),
          role: draft.role,
          title: draft.title?.trim() || undefined,
          email: draft.email?.trim() || '',
        },
      ],
    });
    setDraft({ fullName: '', role: 'director', title: '', email: '' });
  }, [draft, members, updateFormData]);

  const removeMember = useCallback(
    (index: number) => {
      updateFormData({ executiveMembers: members.filter((_, i) => i !== index) });
    },
    [members, updateFormData],
  );

  const inputStyle = [
    styles.input,
    { color: colors.onSurface, borderColor: colors.outline, backgroundColor: colors.surface },
  ];

  return (
    <View style={styles.step} testID="page-wizard-leadership-step">
      <Text style={[M3Typography.headlineSmall, { color: colors.onSurface }]}>Leadership</Text>
      <Text style={[M3Typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: Spacing.sm }]}>
        {required
          ? 'List directors or executive members for compliance review. Add at least one person.'
          : 'Optionally list key organisers or board members. Helps build trust with your community.'}
      </Text>

      {members.length > 0 ? (
        <WizardFormSection title="Added members" icon="people-outline">
          {members.map((member, index) => (
            <View
              key={`${member.fullName}-${index}`}
              style={[styles.memberRow, { borderColor: colors.outlineVariant }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[M3Typography.titleSmall, { color: colors.onSurface }]}>{member.fullName}</Text>
                <Text style={[M3Typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                  {ROLE_OPTIONS.find((r) => r.value === member.role)?.label ?? member.role}
                  {member.title ? ` · ${member.title}` : ''}
                  {member.email ? ` · ${member.email}` : ''}
                </Text>
              </View>
              <Pressable
                onPress={() => removeMember(index)}
                accessibilityLabel={`Remove ${member.fullName}`}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </Pressable>
            </View>
          ))}
        </WizardFormSection>
      ) : null}

      {getFieldError('executiveMembers') ? (
        <Text style={[styles.error, { color: colors.error }]}>{getFieldError('executiveMembers')}</Text>
      ) : null}

      <WizardFormSection title="Add a person" subtitle="Full legal name as on registration documents" icon="person-add-outline">
        <Text style={[M3Typography.labelLarge, { color: colors.onSurface }]}>Full name</Text>
        <TextInput
          value={draft.fullName}
          onChangeText={(fullName) => setDraft((d) => ({ ...d, fullName }))}
          placeholder="e.g. Priya Nair"
          placeholderTextColor={colors.onSurfaceVariant}
          style={inputStyle}
          accessibilityLabel="Executive member full name"
        />

        <Text style={[M3Typography.labelMedium, { color: colors.onSurfaceVariant, marginTop: Spacing.sm }]}>
          Role
        </Text>
        <View style={styles.chipRow}>
          {ROLE_OPTIONS.map((opt) => (
            <M3FilterChip
              key={opt.value}
              label={opt.label}
              selected={draft.role === opt.value}
              onPress={() => setDraft((d) => ({ ...d, role: opt.value }))}
            />
          ))}
        </View>

        <Text style={[M3Typography.labelLarge, { color: colors.onSurface, marginTop: Spacing.sm }]}>
          Title (optional)
        </Text>
        <TextInput
          value={draft.title ?? ''}
          onChangeText={(title) => setDraft((d) => ({ ...d, title }))}
          placeholder="e.g. Cultural Director"
          placeholderTextColor={colors.onSurfaceVariant}
          style={inputStyle}
          accessibilityLabel="Executive title"
        />

        <Text style={[M3Typography.labelLarge, { color: colors.onSurface, marginTop: Spacing.sm }]}>
          Email (optional)
        </Text>
        <TextInput
          value={draft.email ?? ''}
          onChangeText={(email) => setDraft((d) => ({ ...d, email }))}
          placeholder="contact@example.com"
          placeholderTextColor={colors.onSurfaceVariant}
          keyboardType="email-address"
          autoCapitalize="none"
          style={inputStyle}
          accessibilityLabel="Executive email"
        />

        <View style={{ marginTop: Spacing.md }}>
          <M3Button
            onPress={addMember}
            variant="outlined"
            disabled={!draft.fullName.trim()}
            accessibilityLabel="Add executive member"
          >
            Add member
          </M3Button>
        </View>
      </WizardFormSection>
    </View>
  );
}

const styles = StyleSheet.create({
  step: { gap: Spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    marginTop: 6,
    fontSize: 16,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.sm },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  error: { ...M3Typography.bodySmall, marginTop: 4 },
});