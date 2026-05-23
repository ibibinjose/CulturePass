import React, {
  useState, useCallback, useEffect, useRef,
} from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, ActivityIndicator, Modal,
  TextInput, KeyboardAvoidingView, Keyboard, Share, Animated,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';
import { useColors, useIsDark } from '@/hooks/useColors';
import { CultureTokens, CardTokens, gradients } from '@/design-system/tokens/theme';
import { getCommunityHeadline, getCommunityProfilePathId } from '@/lib/community';
import { canonicalCommunityPath, canonicalEventPath, siteUrl } from '@/lib/publicPaths';
import { Button } from '@/design-system/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import { timeAgo } from '@/lib/dateUtils';
import {
  subscribeComments, subscribeCommentCount,
  addComment, toggleLike, subscribeLiked, subscribeLikeCount, reportPost,
} from '@/lib/feedService';
import type { Community } from '@/shared/schema';
import { ACCENT, COUNTRY_FLAG, USE_NATIVE_DRIVER } from './feedConstants';
import { getDateLabel, getInitials, postCollection, postId } from './feedHelpers';
import type { FeedPost } from './types';

const REPORT_REASONS = [
  'Spam or misleading', 'Hate speech or discrimination',
  'Harassment or bullying', 'Violence or dangerous content',
  'Nudity or sexual content', 'Other',
];

export function ReportModal({ visible, onClose, onReport, colors }: {
  visible: boolean; onClose: () => void; onReport: (reason: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [selected, setSelected] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = useCallback(async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try { onReport(selected); } finally { setSubmitting(false); onClose(); }
  }, [selected, submitting, onReport, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[rm.overlay]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[rm.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[rm.title, { color: colors.text }]}>Report Post</Text>
          <Text style={[rm.sub, { color: colors.textSecondary }]}>Why are you reporting this?</Text>
          {REPORT_REASONS.map((r) => (
            <Pressable
              key={r}
              style={[rm.row, { borderColor: colors.borderLight },
                selected === r && { borderColor: CultureTokens.indigo, backgroundColor: CultureTokens.indigo + '12' }]}
              onPress={() => setSelected(r)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected === r }}
            >
              <View style={[rm.radio, { borderColor: selected === r ? CultureTokens.indigo : colors.border }]}>
                {selected === r && <View style={[rm.dot, { backgroundColor: CultureTokens.indigo }]} />}
              </View>
              <Text style={[rm.rowText, { color: colors.text }]}>{r}</Text>
            </Pressable>
          ))}
          <View style={rm.actions}>
            <Button variant="outline" size="md" onPress={onClose} style={{ flex: 1 }}>Cancel</Button>
            <Button variant="danger" size="md" onPress={handleSubmit} disabled={!selected || submitting} loading={submitting} style={{ flex: 1 }}>Report</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const rm = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 20 },
  card:    { width: '100%', maxWidth: 380, borderRadius: 18, borderWidth: 1, padding: 20, gap: 10 },
  title:   { fontSize: 17, fontFamily: 'Poppins_700Bold', lineHeight: 24 },
  sub:     { fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 4, lineHeight: 18 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
  radio:   { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot:     { width: 8, height: 8, borderRadius: 4 },
  rowText: { fontSize: 14, fontFamily: 'Poppins_500Medium', flex: 1, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
});

// ── Post action sheet ─────────────────────────────────────────────────────────

export function PostMoreMenu({ visible, onClose, onReport, onHide, isOwn, colors }: {
  visible: boolean; onClose: () => void; onReport: () => void;
  onHide: () => void; isOwn: boolean; colors: ReturnType<typeof useColors>;
}) {
  const items = isOwn
    ? [{ icon: 'trash-outline' as const, label: 'Delete post', color: CultureTokens.coral, action: onHide }]
    : [
        { icon: 'eye-off-outline' as const,  label: 'Hide this post', color: colors.textSecondary, action: onHide },
        { icon: 'flag-outline' as const,     label: 'Report post',    color: CultureTokens.coral,  action: onReport },
      ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={mo.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[mo.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {items.map((item) => (
            <Pressable
              key={item.label}
              style={[mo.row, { borderBottomColor: colors.borderLight }]}
              onPress={() => { onClose(); item.action(); }}
              accessibilityRole="button"
            >
              <Ionicons name={item.icon} size={20} color={item.color} />
              <Text style={[mo.label, { color: item.color }]}>{item.label}</Text>
            </Pressable>
          ))}
          <Pressable style={mo.cancel} onPress={onClose} accessibilityRole="button">
            <Text style={[mo.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const mo = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:      { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, paddingBottom: 28, paddingTop: 8 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  label:      { fontSize: 15, fontFamily: 'Poppins_500Medium', lineHeight: 20 },
  cancel:     { paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center' },
  cancelText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', lineHeight: 20 },
});
