import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/theme';
import { Input } from '@/design-system/ui/Input';
import { Button } from '@/design-system/ui/Button';
import { useColors } from '@/hooks/useColors';
import { SubmitCard, SubmitSectionLabel, SubmitField } from '@/components/submit/FormPrimitives';
import { FormData, TierDraft } from './types';
import type { CreateStyles } from './styles';

interface Props {
  form: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
  currency: string;
  showAddTier: boolean;
  setShowAddTier: (v: boolean) => void;
  newTier: TierDraft;
  setNewTier: React.Dispatch<React.SetStateAction<TierDraft>>;
  addTier: () => void;
  removeTier: (index: number) => void;
  haptic: () => void;
}

const TIER_PRESETS = ['Early Bird', 'General Admission', 'VIP'];

const getCurrencyLabel = (currency: string): string => (currency === 'AUD' ? 'A$' : currency);

const formatTierPrice = (price: string, currency: string): string => {
  const amount = parseFloat(price || '0');
  if (!Number.isFinite(amount) || amount <= 0) return 'Free';
  if (currency === 'AUD') {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return `${currency} ${amount.toFixed(2)}`;
};

export function StepTickets({ form, setField, colors, s, currency, showAddTier, setShowAddTier, newTier, setNewTier, addTier, removeTier, haptic }: Props) {
  const currencyLabel = getCurrencyLabel(currency);
  const questionsText = form.customQuestions.join(', ');
  return (
    <>
      <SubmitCard colors={colors} hPad={0}>
        <SubmitSectionLabel label="Tickets & Capacity" icon="ticket-outline" accent={CultureTokens.gold} colors={colors} />
        <SubmitField label="Ticket tiers" hint="Each tier can have its own price and capacity.">
          {form.tiers.map((tier, i) => (
            <View key={i} style={[s.tierRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, marginBottom: i < form.tiers.length - 1 ? 8 : 0 }]}>
              <View style={s.tierInfo}>
                <Text style={[s.tierName, { color: colors.text }]}>{tier.name}</Text>
                <Text style={[s.tierDetails, { color: colors.textSecondary }]}>
                  {formatTierPrice(tier.priceCents, currency)}
                  {tier.capacity ? ` · ${tier.capacity} spots` : ''}
                </Text>
              </View>
              <Pressable onPress={() => removeTier(i)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove ${tier.name} tier`}>
                <Ionicons name="close-circle" size={22} color={CultureTokens.coral} />
              </Pressable>
            </View>
          ))}
          {form.tiers.length === 0 ? (
            <Text style={[s.sectionNote, { color: colors.textTertiary }]}>No tiers yet — add one below.</Text>
          ) : null}
        </SubmitField>

        {showAddTier ? (
          <SubmitField label="New tier">
            <View style={[s.addTierForm, { backgroundColor: colors.surfaceElevated, borderColor: CultureTokens.gold + '40' }]}>
              <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>TIER NAME</Text>
              <View style={s.tierPresets}>
                {TIER_PRESETS.map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => setNewTier((t) => ({ ...t, name: preset }))}
                    style={[s.tierPreset, { borderColor: newTier.name === preset ? CultureTokens.gold : colors.border, backgroundColor: newTier.name === preset ? CultureTokens.gold + '15' : colors.background }]}
                    accessibilityRole="button"
                  >
                    <Text style={[s.tierPresetText, { color: newTier.name === preset ? CultureTokens.gold : colors.textSecondary }]}>{preset}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                value={newTier.name}
                onChangeText={(v: any) => setNewTier((t) => ({ ...t, name: v }))}
                placeholder="Or type custom tier name…"
                placeholderTextColor={colors.textTertiary}
              />
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>PRICE ({currencyLabel})</Text>
                  <TextInput
                    style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                    value={newTier.priceCents}
                    onChangeText={(v: any) => setNewTier((t) => ({ ...t, priceCents: v.replace(/[^0-9.]/g, '') }))}
                    placeholder="0.00 = Free"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>CAPACITY</Text>
                  <TextInput
                    style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                    value={newTier.capacity}
                    onChangeText={(v: any) => setNewTier((t) => ({ ...t, capacity: v.replace(/[^0-9]/g, '') }))}
                    placeholder="Unlimited"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <View style={s.row}>
                <Button variant="outline" size="sm" onPress={() => setShowAddTier(false)} style={{ flex: 1 }}>Cancel</Button>
                <Button variant="primary" size="sm" onPress={addTier} style={{ flex: 1, backgroundColor: CultureTokens.gold }}>Add Tier</Button>
              </View>
            </View>
          </SubmitField>
        ) : (
          <Pressable
            onPress={() => { setShowAddTier(true); haptic(); }}
            style={[s.addTierBtn, { borderColor: CultureTokens.gold + '60', backgroundColor: CultureTokens.gold + '10' }]}
            accessibilityRole="button"
            accessibilityLabel="Add ticket tier"
          >
            <Ionicons name="add-circle-outline" size={22} color={CultureTokens.gold} />
            <Text style={[s.addTierText, { color: CultureTokens.gold }]}>Add Ticket Tier</Text>
          </Pressable>
        )}

        <SubmitField label="Overall capacity" hint="Optional cap across all tiers">
          <Input
            label={undefined}
            value={form.capacity}
            onChangeText={(v: any) => setField('capacity', v.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 500 total attendees"
            keyboardType="number-pad"
            leftIcon="people-outline"
            accessibilityLabel="Event capacity"
            containerStyle={{ marginBottom: 0 }}
          />
        </SubmitField>
      </SubmitCard>

      <SubmitCard colors={colors} hPad={0}>
        <SubmitSectionLabel label="Access & Registration" icon="lock-closed-outline" accent={CultureTokens.indigo} colors={colors} />
        <SubmitField label="Access toggles">
          <View style={s.typeGrid}>
            {[
              { key: 'requireApproval', label: 'Require approval', value: form.requireApproval },
              { key: 'waitlistEnabled', label: 'Enable waitlist', value: form.waitlistEnabled },
              { key: 'sendReminders', label: 'Send reminders', value: form.sendReminders },
            ].map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => setField(opt.key as keyof FormData, (!opt.value) as never)}
                style={({ pressed }) => [
                  s.typeChip,
                  {
                    borderColor: opt.value ? CultureTokens.gold : colors.border,
                    backgroundColor: opt.value ? CultureTokens.gold + '15' : colors.surfaceElevated,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: opt.value }}
              >
                <Ionicons name={opt.value ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={opt.value ? CultureTokens.gold : colors.textSecondary} />
                <Text style={[s.tagLabel, { color: opt.value ? CultureTokens.gold : colors.text }]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </SubmitField>

        <SubmitField label="Guest list visibility">
          <View style={s.typeGrid}>
            {[
              { id: 'host_only', label: 'Host only' },
              { id: 'attendees_only', label: 'Attendees only' },
              { id: 'public', label: 'Public' },
            ].map((opt) => {
              const selected = form.guestListVisibility === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setField('guestListVisibility', opt.id as FormData['guestListVisibility'])}
                  style={({ pressed }) => [
                    s.typeChip,
                    {
                      borderColor: selected ? CultureTokens.gold : colors.border,
                      backgroundColor: selected ? CultureTokens.gold + '15' : colors.surfaceElevated,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Text style={[s.tagLabel, { color: selected ? CultureTokens.gold : colors.text }]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </SubmitField>

        <SubmitField label="Max tickets per order" hint="Optional">
          <Input
            label={undefined}
            value={form.maxTicketsPerOrder}
            onChangeText={(v: any) => setField('maxTicketsPerOrder', v.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 4"
            keyboardType="number-pad"
            accessibilityLabel="Max tickets per order"
            containerStyle={{ marginBottom: 0 }}
          />
        </SubmitField>

        <SubmitField label="Custom registration questions" hint="Comma-separated">
          <Input
            label={undefined}
            value={questionsText}
            onChangeText={(v: any) =>
              setField(
                'customQuestions',
                v
                  .split(',')
                  .map((q: any) => q.trim())
                  .filter(Boolean),
              )
            }
            placeholder="e.g. Dietary requirements, Company name"
            accessibilityLabel="Custom registration questions"
            containerStyle={{ marginBottom: 0 }}
          />
        </SubmitField>

        <SubmitField label="Registration fields">
          <View style={s.typeGrid}>
            {[
              { id: 'name', label: 'Name', required: true },
              { id: 'email', label: 'Email', required: true },
              { id: 'phone', label: 'Phone', required: false },
              { id: 'company', label: 'Company', required: false },
            ].map((f) => {
              const enabled = form.registrationFields[f.id as keyof FormData['registrationFields']];
              const locked = f.required;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => {
                    if (locked) return;
                    const key = f.id as keyof FormData['registrationFields'];
                    setField('registrationFields', { ...form.registrationFields, [key]: !enabled });
                  }}
                  style={({ pressed }) => [
                    s.typeChip,
                    {
                      borderColor: enabled ? CultureTokens.gold : colors.border,
                      backgroundColor: enabled ? CultureTokens.gold + '15' : colors.surfaceElevated,
                      opacity: locked ? 0.7 : pressed ? 0.8 : 1,
                    },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: enabled, disabled: locked }}
                >
                  <Ionicons
                    name={enabled ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={enabled ? CultureTokens.gold : colors.textSecondary}
                  />
                  <Text style={[s.tagLabel, { color: enabled ? CultureTokens.gold : colors.text }]}>
                    {f.label}{locked ? ' (required)' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SubmitField>

        <SubmitField label="Reminder schedule" hint="Offsets before the event">
          <View style={s.typeGrid}>
            {[
              { mins: 10080, label: '1 week before' },
              { mins: 1440, label: '1 day before' },
              { mins: 120, label: '2 hours before' },
              { mins: 15, label: '15 mins before' },
            ].map((r) => {
              const enabled = form.reminderOffsetsMinutes.includes(r.mins);
              return (
                <Pressable
                  key={r.mins}
                  onPress={() => {
                    const next = enabled
                      ? form.reminderOffsetsMinutes.filter((m) => m !== r.mins)
                      : [...form.reminderOffsetsMinutes, r.mins].sort((a, b) => b - a);
                    setField('reminderOffsetsMinutes', next);
                  }}
                  style={({ pressed }) => [
                    s.typeChip,
                    {
                      borderColor: enabled ? CultureTokens.indigo : colors.border,
                      backgroundColor: enabled ? CultureTokens.indigo + '15' : colors.surfaceElevated,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: enabled }}
                >
                  <Text style={[s.tagLabel, { color: enabled ? CultureTokens.indigo : colors.text }]}>
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={[s.typeGrid, { marginTop: 8 }]}>
            {[
              { key: 'sendReminders', label: 'Send reminders' },
              { key: 'reminderAutomationEnabled', label: 'Automation hooks enabled' },
            ].map((opt) => {
              const active = form[opt.key as keyof FormData] as boolean;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setField(opt.key as keyof FormData, (!active) as never)}
                  style={({ pressed }) => [
                    s.typeChip,
                    {
                      borderColor: active ? CultureTokens.indigo : colors.border,
                      backgroundColor: active ? CultureTokens.indigo + '15' : colors.surfaceElevated,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                >
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={active ? CultureTokens.indigo : colors.textSecondary}
                  />
                  <Text style={[s.tagLabel, { color: active ? CultureTokens.indigo : colors.text }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SubmitField>
      </SubmitCard>
    </>
  );
}
