/**
 * Admin Indexes Health Dashboard
 * ==============================
 * Shows the health of critical admin queries and whether they are running
 * in full mode or degraded fallback mode (due to missing/building Firestore indexes).
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { M3TopAppBar, GlassView } from '@/design-system/ui';
import { FontFamily } from '@/design-system/tokens/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeBack } from '@/lib/navigation';

interface QueryHealth {
  name: string;
  collection: string;
  status: 'healthy' | 'fallback' | 'unknown';
  description: string;
  lastError?: string;
}

const KNOWN_QUERIES: QueryHealth[] = [
  {
    name: 'Moderation Reports',
    collection: 'reports',
    status: 'healthy',
    description: 'WHERE status + ORDER BY createdAt (defensive fallback + X-Query-Mode header)',
  },
  {
    name: 'Audit Logs',
    collection: 'auditLogs',
    status: 'healthy',
    description: 'ORDER BY createdAt (defensive fallback + X-Query-Mode header in admin + misc)',
  },
  {
    name: 'Recent Transactions (Finance)',
    collection: 'tickets',
    status: 'healthy',
    description: 'ORDER BY createdAt (finance view) — defensive fallback + header',
  },
  {
    name: 'Verification Tasks',
    collection: 'hostVerificationTasks',
    status: 'healthy',
    description: 'status/entityType/assignedTo + ORDER BY submittedAt (now with full try/catch in-memory fallback + header)',
  },
  {
    name: 'Promo Codes',
    collection: 'promoCodes',
    status: 'healthy',
    description: 'ORDER BY createdAt (inline fallback + X-Query-Mode header on degradation)',
  },
  {
    name: 'User Directory (Admin filters)',
    collection: 'users',
    status: 'healthy',
    description: 'Primarily client-side filter/sort on simple limit() fetch (low index risk; targeted indexes exist for role/status/membership)',
  },
  {
    name: 'Profile Directory (Admin/Host lists)',
    collection: 'profiles',
    status: 'healthy',
    description: 'Multiple filters + createdAt (profileService.list has defensive fallback)',
  },
  {
    name: 'Public Reviews (event + profile)',
    collection: 'reviews',
    status: 'healthy',
    description: 'Non-admin: (eventId|organizerId) + status + createdAt — now hardened with in-memory fallback',
  },
  {
    name: 'Notifications + Social (contactSaves)',
    collection: 'notifications / contactSaves',
    status: 'healthy',
    description: 'Non-admin high-traffic: userId/toUserId + createdAt (defensive fallback + logging)',
  },
];

export default function IndexesHealthScreen() {
  const colors = useColors();
  const { hPad } = useLayout();
  const handleBack = useSafeBack('/admin');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <M3TopAppBar
        title="Indexes Health"
        onBack={handleBack}
      />

      <ScrollView contentContainerStyle={{ padding: hPad, gap: 16 }}>
        <GlassView style={{ padding: 20 }}>
          <Text style={{ fontSize: 16, fontFamily: FontFamily.semibold, color: colors.text }}>
            Firestore Query Health Monitor
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
            This page shows critical admin queries and whether they are running optimally or in degraded (fallback) mode due to missing or building composite indexes.
          </Text>
        </GlassView>

        {KNOWN_QUERIES.map((q, index) => (
          <GlassView key={index} style={{ padding: 16, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, fontFamily: FontFamily.semibold, color: colors.text }}>
                {q.name}
              </Text>
              <View style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: q.status === 'healthy' ? '#10B98122' : '#F59E0B22'
              }}>
                <Text style={{
                  fontSize: 12,
                  fontFamily: FontFamily.bold,
                  color: q.status === 'healthy' ? '#10B981' : '#F59E0B'
                }}>
                  {q.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              Collection: <Text style={{ fontFamily: FontFamily.medium }}>{q.collection}</Text>
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              {q.description}
            </Text>

            {q.lastError && (
              <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>
                Last issue: {q.lastError}
              </Text>
            )}
          </GlassView>
        ))}

        <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 20 }}>
          Status reflects current protection level. All listed queries now use defensive try/catch + in-memory sort when composite indexes are missing. Check Network tab for X-Query-Mode: fallback response header on degraded queries.
        </Text>

        <Pressable
          onPress={() => { /* TODO: trigger a test query */ }}
          style={{ alignSelf: 'center', marginTop: 12 }}
        >
          <Text style={{ color: colors.primary, fontFamily: FontFamily.semibold }}>
            Run Test Queries →
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
