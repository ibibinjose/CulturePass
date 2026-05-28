import React from 'react';
import { View, Text } from 'react-native';
import { FontFamily } from '@/design-system/tokens/theme';

/**
 * Reusable yellow warning banner for admin queries running in degraded
 * fallback mode (missing composite index → in-memory sort + X-Query-Mode: fallback header).
 *
 * Usage:
 *   <FallbackQueryBanner
 *     visible={showFallback}
 *     queryName="Verification Tasks"
 *     collection="hostVerificationTasks"
 *   />
 *
 * The parent page is responsible for detecting the condition (error message,
 * response header via extended api layer, or known building index).
 */
export function FallbackQueryBanner({
  visible,
  queryName,
  collection,
  detail,
}: {
  visible: boolean;
  queryName: string;
  collection: string;
  detail?: string;
}) {
  if (!visible) return null;

  return (
    <View
      style={{
        backgroundColor: '#FEF3C7',
        borderColor: '#F59E0B',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
      }}
    >
      <Text style={{ color: '#92400E', fontFamily: FontFamily.semibold }}>
        ⚠️ {queryName} query is degraded
      </Text>
      <Text style={{ color: '#92400E', fontSize: 13, marginTop: 4 }}>
        Firestore index for {collection} is still building or missing. Results are sorted in-memory.
        This is temporary — the page recovers automatically once the index is ready.
      </Text>
      {detail && (
        <Text style={{ color: '#78350F', fontSize: 12, marginTop: 6, fontFamily: FontFamily.mono }}>
          {detail}
        </Text>
      )}
    </View>
  );
}
