/**
 * TeamOrganizersStep
 *
 * New conditional step for Community + Business entity types.
 * Allows the primary organizer to search + invite additional team members
 * by handle or email and assign roles.
 *
 * Roles supported: lead_organizer, co_organizer, manager, moderator, editor
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import { CultureTokens, FontFamily, Radius, Spacing } from '@/design-system/tokens/theme';
import { M3Button, M3Card } from '@/design-system/ui';
import { modulesApi } from '@/modules/api';
import type { WizardStepProps } from '../FormWizard/WizardStep';

const TEAM_ROLES = [
  { value: 'co_organizer', label: 'Co-Organizer' },
  { value: 'manager', label: 'Manager' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'editor', label: 'Editor / Content' },
] as const;

const ROLE_DESCRIPTIONS: Record<string, string> = {
  lead_organizer: 'Full control',
  co_organizer: 'Can manage most things',
  manager: 'Day-to-day operations',
  moderator: 'Content & community moderation',
  editor: 'Can edit content & events',
};

export function TeamOrganizersStep({ formData, updateFormData }: WizardStepProps) {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('co_organizer');

  const currentOrganizers = (formData as any).organizers || [];

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const res = await (((api as any).search?.query?.({ q: search, type: 'user', limit: 6 }) as any) || { results: [] }) ?? { results: [] };
      const users = (res.results || []).filter((r: any) => r.type === 'user');
      setSearchResults(users.slice(0, 5));
    } catch {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addOrganizer = (user: any) => {
    const alreadyExists = currentOrganizers.some((o: any) => o.userId === user.id);
    if (alreadyExists) return;

    const newOrg = {
      userId: user.id,
      role: selectedRole,
      title: TEAM_ROLES.find(r => r.value === selectedRole)?.label,
      addedAt: new Date().toISOString(),
    };

    updateFormData({
      organizers: [...currentOrganizers, newOrg],
    } as any);
    setSearch('');
    setSearchResults([]);
  };

  const removeOrganizer = (userId: string) => {
    updateFormData({
      organizers: currentOrganizers.filter((o: any) => o.userId !== userId),
    } as any);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Team &amp; Organizers</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Add co-organizers, managers, and moderators for this {formData.entityType}. 
        They will be able to manage events, content, and members.
      </Text>

      {/* Current Team */}
      <M3Card style={styles.teamCard}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Current Team ({currentOrganizers.length + 1})</Text>
        
        {/* Creator is always lead */}
        <View style={styles.orgRow}>
          <Ionicons name="star" size={18} color={CultureTokens.gold} />
          <Text style={[styles.orgName, { color: colors.text }]}>You (Lead Organizer)</Text>
          <Text style={styles.roleBadge}>LEAD</Text>
        </View>

        {currentOrganizers.map((org: any, index: number) => (
          <View key={index} style={styles.orgRow}>
            <Ionicons name="person" size={18} color={colors.textSecondary} />
            <Text style={[styles.orgName, { color: colors.text }]}>{org.userId}</Text>
            <Text style={styles.roleBadge}>{org.role.replace('_', ' ').toUpperCase()}</Text>
            <Pressable onPress={() => removeOrganizer(org.userId)} style={{ marginLeft: 'auto' }}>
              <Ionicons name="close-circle" size={20} color={colors.error} />
            </Pressable>
          </View>
        ))}
      </M3Card>

      {/* Add new member */}
      <View style={styles.addSection}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Invite Additional Organizer</Text>

        <View style={styles.searchRow}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by @handle or email"
            style={[styles.searchInput, { borderColor: colors.borderLight, color: colors.text }]}
            autoCapitalize="none"
          />
          <M3Button onPress={handleSearch} disabled={loading || !search.trim()}>
            {loading ? <ActivityIndicator size="small" /> : 'Search'}
          </M3Button>
        </View>

        <View style={styles.rolePicker}>
          <Text style={{ color: colors.textSecondary, marginBottom: 6 }}>Assign Role</Text>
          <View style={styles.roleChips}>
            {TEAM_ROLES.map((role) => (
              <Pressable
                key={role.value}
                onPress={() => setSelectedRole(role.value)}
                style={[
                  styles.roleChip,
                  selectedRole === role.value && { backgroundColor: CultureTokens.indigo, borderColor: CultureTokens.indigo },
                ]}
              >
                <Text style={{ color: selectedRole === role.value ? '#fff' : colors.text }}>
                  {role.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: -4 }}>
            {ROLE_DESCRIPTIONS[selectedRole]}
          </Text>
        </View>

        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable style={styles.resultRow} onPress={() => addOrganizer(item)}>
                <Text style={{ color: colors.text }}>{item.handle || item.username || item.email}</Text>
                <M3Button size="sm" onPress={() => addOrganizer(item)}>Add as {selectedRole}</M3Button>
              </Pressable>
            )}
          />
        )}
      </View>

      <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 12 }}>
        Team members will receive an invitation and can accept/decline. You can manage roles later on the profile page.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  title: { fontSize: 22, fontFamily: FontFamily.bold },
  subtitle: { fontSize: 14, lineHeight: 20 },
  teamCard: { padding: 16, gap: 10 },
  cardTitle: { fontSize: 15, fontFamily: FontFamily.semibold, marginBottom: 8 },
  orgRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orgName: { flex: 1, fontFamily: FontFamily.medium },
  roleBadge: { fontSize: 10, fontFamily: FontFamily.bold, color: CultureTokens.indigo, backgroundColor: `${CultureTokens.indigo}15`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  addSection: { gap: 10 },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchInput: { flex: 1, borderWidth: 1, borderRadius: Radius.md, padding: 12, fontSize: 15 },
  rolePicker: { marginTop: 8 },
  roleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#ddd' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
});
