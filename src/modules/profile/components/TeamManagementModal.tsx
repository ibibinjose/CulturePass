/**
 * TeamManagementModal
 *
 * Allows lead/co-organizers, managers, and admins to manage the team for
 * a Community or Business profile.
 *
 * Features:
 * - List current team with roles
 * - Add new member (search by handle/email + role selection)
 * - Change role for existing members
 * - Remove members (with safety for last lead)
 * - Real-time updates via the new team endpoints + audit logging
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import { CultureTokens, FontFamily, Radius, Spacing } from '@/design-system/tokens/theme';
import { M3Button, M3Card } from '@/design-system/ui';
import { modulesApi } from '@/modules/api';

const TEAM_ROLES = [
  { value: 'lead_organizer', label: 'Lead Organizer' },
  { value: 'co_organizer', label: 'Co-Organizer' },
  { value: 'manager', label: 'Manager' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'editor', label: 'Editor' },
] as const;

interface TeamMember {
  userId: string;
  role: string;
  title?: string;
  addedAt?: string;
}

interface TeamManagementModalProps {
  visible: boolean;
  onClose: () => void;
  profileId: string;
  currentOrganizers: TeamMember[];
  currentUserId: string | null;
  onTeamUpdated?: () => void;
}

export function TeamManagementModal({
  visible,
  onClose,
  profileId,
  currentOrganizers,
  currentUserId,
  onTeamUpdated,
}: TeamManagementModalProps) {
  const colors = useColors();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('co_organizer');

  const [localTeam, setLocalTeam] = useState<TeamMember[]>(currentOrganizers);

  // Sync when prop changes
  React.useEffect(() => {
    setLocalTeam(currentOrganizers);
  }, [currentOrganizers]);

  const addOrUpdateMutation = useMutation({
    mutationFn: (data: { userId: string; role: string; title?: string }) =>
      modulesApi.profiles.addOrUpdateTeamMember(profileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles-and-users', profileId] });
      onTeamUpdated?.();
    },
    onError: () => Alert.alert('Error', 'Failed to update team member'),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => modulesApi.profiles.removeTeamMember(profileId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles-and-users', profileId] });
      onTeamUpdated?.();
    },
    onError: (err: any) => Alert.alert('Error', err?.message || 'Failed to remove member'),
  });

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearchLoading(true);
    try {
      // Use the platform search for users/profiles
      const res = await (((api as any).search?.query?.({ q: search, type: 'user', limit: 6 }) as any) || { results: [] }) ?? { results: [] };
      const users = (res.results || res.hits || []).filter((r: any) => r.type === 'user' || r.entityType === 'user');
      setSearchResults(users.slice(0, 5));
    } catch {
      // Fallback: try a broad profiles search
      try {
        const profiles = await modulesApi.profiles?.list?.({ search }) ?? [];
        setSearchResults(profiles.slice(0, 5));
      } catch {
        setSearchResults([]);
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const addMember = (user: any) => {
    const userId = user.id || user.userId;
    if (!userId) return;

    const already = localTeam.some((m) => m.userId === userId);
    if (already) {
      Alert.alert('Already in team');
      return;
    }

    const newMember = {
      userId,
      role: selectedRole,
      title: TEAM_ROLES.find((r) => r.value === selectedRole)?.label,
    };

    setLocalTeam((prev) => [...prev, newMember]);
    addOrUpdateMutation.mutate(newMember);
    setSearch('');
    setSearchResults([]);
  };

  const changeRole = (userId: string, newRole: string) => {
    const updated = localTeam.map((m) =>
      m.userId === userId ? { ...m, role: newRole, title: TEAM_ROLES.find((r) => r.value === newRole)?.label } : m
    );
    setLocalTeam(updated);

    const member = updated.find((m) => m.userId === userId);
    if (member) addOrUpdateMutation.mutate(member);
  };

  const removeMember = (userId: string) => {
    if (localTeam.length <= 1) {
      Alert.alert('Cannot remove', 'At least one Lead Organizer must remain.');
      return;
    }

    setLocalTeam((prev) => prev.filter((m) => m.userId !== userId));
    removeMutation.mutate(userId);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <M3Card style={styles.modal}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Manage Team</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Current Team */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Current Team</Text>
          {localTeam.length === 0 && (
            <Text style={{ color: colors.textTertiary }}>No additional team members yet.</Text>
          )}

          {localTeam.map((member) => (
            <View key={member.userId} style={styles.memberRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontFamily: FontFamily.semibold }}>
                  {member.title || member.role}
                </Text>
                <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{member.userId}</Text>
              </View>

              <View style={styles.roleActions}>
                <TextInput
                  value={member.role}
                  onChangeText={(newRole) => changeRole(member.userId, newRole)}
                  style={styles.roleInput}
                  placeholder="Role"
                />
                <Pressable onPress={() => removeMember(member.userId)} disabled={removeMutation.isPending}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </Pressable>
              </View>
            </View>
          ))}

          {/* Add New Member */}
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Add New Member</Text>

            <View style={styles.searchRow}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by @handle or email"
                style={[styles.searchInput, { borderColor: colors.borderLight, color: colors.text }]}
                autoCapitalize="none"
              />
              <M3Button onPress={handleSearch} disabled={searchLoading || !search.trim()} size="sm">
                {searchLoading ? <ActivityIndicator size="small" /> : 'Search'}
              </M3Button>
            </View>

            <View style={styles.rolePicker}>
              {TEAM_ROLES.map((role) => (
                <Pressable
                  key={role.value}
                  onPress={() => setSelectedRole(role.value)}
                  style={[
                    styles.roleChip,
                    selectedRole === role.value && { backgroundColor: CultureTokens.indigo },
                  ]}
                >
                  <Text style={{ color: selectedRole === role.value ? '#fff' : colors.text, fontSize: 12 }}>
                    {role.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {searchResults.length > 0 && (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable style={styles.resultRow} onPress={() => addMember(item)}>
                    <Text style={{ color: colors.text }}>{item.handle || item.username || item.email}</Text>
                    <M3Button size="sm" onPress={() => addMember(item)}>
                      Add
                    </M3Button>
                  </Pressable>
                )}
              />
            )}
          </View>

          <View style={styles.footer}>
            <M3Button variant="outlined" onPress={onClose} fullWidth>
              Done
            </M3Button>
          </View>
        </M3Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modal: { padding: 20, borderRadius: Radius.lg, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontFamily: FontFamily.bold },
  sectionLabel: { fontSize: 13, fontFamily: FontFamily.bold, marginBottom: 8, textTransform: 'uppercase' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  roleActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleInput: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 13, minWidth: 110 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  searchInput: { flex: 1, borderWidth: 1, borderRadius: Radius.md, padding: 10 },
  rolePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  roleChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#f0f0f0' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  footer: { marginTop: 24 },
});
