import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily, Radius } from '@/design-system/tokens/theme';
import type { SavedContact } from '@/repositories/ContactsRepository';
import { contactDisplayName } from '../lib/contactDisplayName';

type Props = {
  contact: SavedContact;
  onPress: () => void;
  onTogglePin: () => void;
};

export function ContactListRow({ contact, onPress, onTogglePin }: Props) {
  const colors = useColors();
  const isPinned = !!contact.pinned;
  const displayName = contactDisplayName(contact);
  const initials = displayName
    .replace(/^@/, '')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const hasNotes = !!(contact.notes ?? '').trim();

  const rowStyle = {
    backgroundColor: colors.surface,
    borderColor: isPinned ? CultureTokens.gold + '35' : colors.borderLight,
  };

  return (
    <View style={[styles.row, rowStyle]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.mainHit, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
      >
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          {contact.avatarUrl ? (
            <Image source={{ uri: contact.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
          )}
          {contact.tier && contact.tier !== 'free' ? (
            <View style={[styles.tierDot, { backgroundColor: CultureTokens.gold, borderColor: colors.surface }]} />
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            {isPinned ? <Ionicons name="pin" size={14} color={CultureTokens.gold} /> : null}
          </View>
          <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            {contact.username ? `@${contact.username}` : contact.cpid}
            {contact.city ? ` · ${contact.city}` : ''}
          </Text>
          {(contact.tags?.length ?? 0) > 0 || hasNotes ? (
            <View style={styles.chips}>
              {hasNotes ? (
                <View style={[styles.chip, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="document-text-outline" size={10} color={colors.textTertiary} />
                  <Text style={[styles.chipText, { color: colors.textSecondary }]}>Notes</Text>
                </View>
              ) : null}
              {contact.tags?.slice(0, 2).map(t => (
                <View key={t} style={[styles.chip, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.chipText, { color: colors.primary }]}>{t}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </Pressable>

      <Pressable
        onPress={onTogglePin}
        hitSlop={10}
        style={({ pressed }) => [styles.pinHit, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel={isPinned ? 'Unpin contact' : 'Pin contact'}
      >
        <Ionicons
          name={isPinned ? 'pin' : 'pin-outline'}
          size={20}
          color={isPinned ? CultureTokens.gold : colors.textTertiary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.04)' } as Record<string, unknown>,
    }),
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 18, fontFamily: FontFamily.bold },
  tierDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  body: { flex: 1, minWidth: 0, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontFamily: FontFamily.semibold, flex: 1, letterSpacing: -0.2 },
  meta: { fontSize: 13, fontFamily: FontFamily.regular },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chipText: { fontSize: 11, fontFamily: FontFamily.semibold },
  mainHit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 4,
    minWidth: 0,
    ...Platform.select({ web: { cursor: 'pointer' } as Record<string, unknown>, default: {} }),
  },
  pinHit: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as Record<string, unknown>, default: {} }),
  },
});
