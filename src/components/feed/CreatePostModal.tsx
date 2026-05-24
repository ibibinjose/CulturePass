import React, {
  useState, useCallback, useEffect, useRef,
} from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, Modal,
  TextInput, KeyboardAvoidingView, Keyboard,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';
import { useColors, useIsDark } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/theme';
import { Button } from '@/design-system/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import type { Community } from '@/shared/schema';

// ── Create post modal ─────────────────────────────────────────────────────────

export function CreatePostModal({ visible, onClose, onSubmit, communities, colors, mode = 'standard' }: {
  visible: boolean; onClose: () => void;
  onSubmit: (
    communityId: string,
    communityName: string,
    body: string,
    imageUri?: string,
    postStyle?: 'standard' | 'story',
  ) => void | Promise<void>;
  communities: Community[]; colors: ReturnType<typeof useColors>;
  mode?: 'standard' | 'story';
}) {
  const [body,         setBody]         = useState('');
  const [selectedComm, setSelectedComm] = useState<Community | null>(null);
  const [imageUri,     setImageUri]     = useState<string | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');

  const maxChars = mode === 'story' ? 280 : 500;

  useEffect(() => {
    if (!visible) return;
    setBody('');
    setImageUri(null);
    setError('');
  }, [visible, mode]);

  useEffect(() => {
    if (visible && communities.length > 0) {
      setSelectedComm(communities[0]);
    }
  }, [visible, communities]);

  const handleClose = useCallback(() => {
    setBody(''); setImageUri(null); setError(''); onClose();
  }, [onClose]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { setError('Library permission denied'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: mode === 'story' ? [9, 16] : [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }, [mode]);

  const handleSubmit = useCallback(async () => {
    if (!body.trim() || !selectedComm || submitting) return;
    if (body.trim().length > maxChars) {
      setError(mode === 'story' ? `Story must be under ${maxChars} characters.` : 'Post must be under 500 characters.');
      return;
    }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitting(true); setError('');
    try {
      await onSubmit(
        selectedComm.id,
        selectedComm.name,
        body.trim(),
        imageUri || undefined,
        mode === 'story' ? 'story' : 'standard',
      );
      setBody(''); setImageUri(null); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post.');
    } finally {
      setSubmitting(false);
    }
  }, [body, selectedComm, submitting, onSubmit, onClose, imageUri, maxChars, mode]);

  const remaining = maxChars - body.length;
  const canPost   = body.trim().length > 0 && selectedComm !== null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS !== 'web'}
      >
        <View style={[cpm.backdrop]}>
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)' }]} onPress={Keyboard.dismiss} />
          <View style={[cpm.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[cpm.handle, { backgroundColor: colors.border }]} />
            <View style={[cpm.header, { borderBottomColor: colors.borderLight }]}>
              <Button variant="ghost" size="sm" onPress={handleClose}>Cancel</Button>
              <Text style={[cpm.title, { color: colors.text }]}>
                {mode === 'story' ? 'Story status' : 'Create Post'}
              </Text>
              <Button variant="primary" size="sm" onPress={handleSubmit} disabled={!canPost} loading={submitting}>Post</Button>
            </View>

            {communities.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={cpm.commScroll} contentContainerStyle={cpm.commRow}>
                {communities.slice(0, 8).map((c) => {
                  const active = selectedComm?.id === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      style={[cpm.chip, {
                        borderColor:     active ? CultureTokens.indigo : colors.border,
                        backgroundColor: active ? CultureTokens.indigo : colors.background,
                      }]}
                      onPress={() => setSelectedComm(c)}
                    >
                      <Text style={[cpm.chipText, { color: active ? '#fff' : colors.textSecondary }]} numberOfLines={1}>{c.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <TextInput
              style={[cpm.input, { color: colors.text }]}
              placeholder={
                mode === 'story'
                  ? `Short story for ${selectedComm?.name ?? 'your community'}…`
                  : `Share something with ${selectedComm?.name ?? 'your community'}…`
              }
              placeholderTextColor={colors.textTertiary}
              value={body}
              onChangeText={(t) => { setBody(t); setError(''); }}
              multiline
              maxLength={maxChars}
              autoFocus
              textAlignVertical="top"
            />

            {imageUri && (
              <View style={mode === 'story' ? cpm.imgPreviewWrapStory : cpm.imgPreviewWrap}>
                <Image source={{ uri: imageUri }} style={cpm.imgPreview} contentFit="cover" />
                <Pressable style={cpm.removeImg} onPress={() => setImageUri(null)}>
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </Pressable>
              </View>
            )}

            <View style={[cpm.toolbar, { borderTopColor: colors.borderLight }]}>
              <Pressable style={[cpm.toolbarBtn, { backgroundColor: CultureTokens.indigo + '12' }]} onPress={pickImage}>
                <Ionicons name="image-outline" size={20} color={CultureTokens.indigo} />
                <Text style={[cpm.toolbarText, { color: CultureTokens.indigo }]}>Photo</Text>
              </Pressable>
            </View>

            <View style={cpm.footer}>
              {error
                ? <Text style={[cpm.error, { color: CultureTokens.coral }]}>{error}</Text>
                : <View />}
              <Text style={[cpm.charCount, { color: remaining < 50 ? CultureTokens.coral : colors.textTertiary }]}>{remaining}</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const cpm = StyleSheet.create({
  backdrop:    { flex: 1, justifyContent: 'flex-end' },
  sheet:       { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, paddingBottom: 34, minHeight: 340 },
  handle:      { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title:       { fontSize: 16, fontFamily: 'Poppins_600SemiBold', lineHeight: 22 },
  commScroll:  { maxHeight: 52 },
  commRow:     { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, maxWidth: 140 },
  chipText:    { fontSize: 12, fontFamily: 'Poppins_500Medium', lineHeight: 17 },
  input:       { minHeight: 120, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 22 },
  imgPreviewWrap:{ marginHorizontal: 18, marginBottom: 12, height: 160, borderRadius: 14, overflow: 'hidden' },
  imgPreviewWrapStory:{ marginHorizontal: 18, marginBottom: 12, height: 220, borderRadius: 14, overflow: 'hidden' },
  imgPreview:  { width: '100%', height: '100%' },
  removeImg:   { position: 'absolute', top: 8, right: 8 },
  toolbar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  toolbarBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  toolbarText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', lineHeight: 18 },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 8 },
  error:       { fontSize: 12, fontFamily: 'Poppins_500Medium', flex: 1, lineHeight: 17 },
  charCount:   { fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 15 },
});
