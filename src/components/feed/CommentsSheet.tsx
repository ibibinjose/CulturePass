import React, {
  useState, useCallback, useEffect, useRef,
} from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, ActivityIndicator, Modal,
  TextInput, KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';
import { useColors, useIsDark } from '@/hooks/useColors';
import { CultureTokens, InputTokens } from '@/design-system/tokens/theme';
import { Button } from '@/design-system/ui/Button';
import { timeAgo } from '@/lib/dateUtils';
import { HapticManager } from '@/lib/haptics';
import {
  subscribeComments,
  addComment,
  type FeedComment,
} from '@/lib/feedService';
import { postCollection, postId } from './feedHelpers';
import type { FeedPost } from './types';

import { UserAvatar } from './feedAvatars';

export function CommentsSheet({ visible, onClose, post, colors }: {
  visible: boolean; onClose: () => void; post: FeedPost;
  colors: ReturnType<typeof useColors>;
}) {
  const { isAuthenticated, user } = useAuth();
  const pid  = postId(post);
  const pcol = postCollection(post.kind);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [body, setBody]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const listRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) return;
    const unsub = subscribeComments(pid, pcol, (c) => {
      setComments(c);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return unsub;
  }, [visible, pid, pcol]);

  const handleSubmit = useCallback(async () => {
    if (!body.trim() || !user || submitting) return;
    setError('');
    await HapticManager.success();
    setSubmitting(true);
    try {
      await addComment(pid, pcol, {
        authorId: user.id,
        authorName: user.username || user.email || 'User',
        authorAvatar: user.avatarUrl,
        body: body.trim(),
      });
      setBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post.');
    } finally {
      setSubmitting(false);
    }
  }, [body, user, pid, pcol, submitting]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[csh.overlay, { backgroundColor: colors.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          enabled={Platform.OS !== 'web'}
          style={csh.kav}
        >
          <View style={[csh.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[csh.handle, { backgroundColor: colors.border }]} />
            <View style={[csh.header, { borderBottomColor: colors.borderLight }]}>
              <View>
                <Text style={[csh.title, { color: colors.text }]}>Comments</Text>
                {comments.length > 0 && (
                  <Text style={[csh.count, { color: colors.textTertiary }]}>
                    {comments.length} comment{comments.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
              <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
                <View style={[csh.closeBtn, { backgroundColor: colors.surfaceElevated }]}>
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </View>
              </Pressable>
            </View>

            {comments.length === 0 ? (
              <View style={csh.empty}>
                <View style={[csh.emptyIcon, { backgroundColor: colors.surfaceElevated }]}>
                  <Ionicons name="chatbubbles-outline" size={28} color={colors.textTertiary} />
                </View>
                <Text style={[csh.emptyTitle, { color: colors.text }]}>No comments yet</Text>
                <Text style={[csh.emptySub, { color: colors.textSecondary }]}>
                  {isAuthenticated ? 'Be the first to comment!' : 'Sign in to join the conversation.'}
                </Text>
              </View>
            ) : (
              <ScrollView ref={listRef} style={csh.list} contentContainerStyle={csh.listContent} keyboardShouldPersistTaps="handled">
                {comments.map((c, i) => (
                  <View key={c.id} style={csh.commentRow}>
                    <UserAvatar name={c.authorName} avatarUrl={c.authorAvatar} size={32} colorIdx={i} />
                    <View style={[csh.bubble, { backgroundColor: colors.surfaceElevated }]}>
                      <View style={csh.bubbleHeader}>
                        <Text style={[csh.commName, { color: colors.text }]}>{c.authorName}</Text>
                        <Text style={[csh.commTime, { color: colors.textTertiary }]}>{timeAgo(c.createdAt)}</Text>
                      </View>
                      <Text style={[csh.commBody, { color: colors.textSecondary }]}>{c.body}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {!!error && <Text style={[csh.error, { color: colors.error }]}>{error}</Text>}

            {isAuthenticated ? (
              <View style={[csh.inputRow, { borderTopColor: colors.borderLight }]}>
                <UserAvatar name={user?.username} avatarUrl={user?.avatarUrl} size={32} colorIdx={0} />
                <TextInput
                  style={[csh.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
                  placeholder="Add a comment…"
                  placeholderTextColor={colors.textTertiary}
                  value={body}
                  onChangeText={(t) => { setBody(t); setError(''); }}
                  returnKeyType="send"
                  onSubmitEditing={handleSubmit}
                  maxLength={300}
                  multiline
                  selectionColor={CultureTokens.indigo}
                  underlineColorAndroid="transparent"
                />
                <Pressable
                  style={[csh.sendBtn, { backgroundColor: body.trim() ? CultureTokens.indigo : colors.border }]}
                  onPress={handleSubmit}
                  disabled={!body.trim() || submitting}
                  accessibilityRole="button"
                  accessibilityLabel="Send comment"
                >
                  {submitting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="send" size={14} color="#fff" />}
                </Pressable>
              </View>
            ) : (
              <View style={{ padding: 16 }}>
                <Button variant="primary" size="md" fullWidth leftIcon="log-in-outline" onPress={() => { onClose(); router.push('/(onboarding)/login'); }}>
                  Sign in to join the conversation
                </Button>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const csh = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'flex-end' },
  kav:        { maxHeight: '90%' },
  sheet:      { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderBottomWidth: 0, minHeight: 320 },
  handle:     { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  title:      { fontSize: 16, fontFamily: 'Poppins_700Bold', lineHeight: 22 },
  count:      { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2, lineHeight: 15 },
  closeBtn:   { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  empty:      { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyIcon:  { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold', lineHeight: 20 },
  emptySub:   { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  list:       { maxHeight: 400 },
  listContent:{ padding: 14, gap: 10 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bubble:     { flex: 1, borderRadius: 14, padding: 10, gap: 3 },
  bubbleHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commName:   { fontSize: 12, fontFamily: 'Poppins_700Bold', lineHeight: 16 },
  commBody:   { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  commTime:   { fontSize: 10, fontFamily: 'Poppins_400Regular', lineHeight: 14 },
  error:      { fontSize: 12, fontFamily: 'Poppins_500Medium', paddingHorizontal: 18, paddingTop: 4, lineHeight: 17 },
  inputRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
  input:      { flex: 1, minHeight: 40, maxHeight: 100, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  sendBtn:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
