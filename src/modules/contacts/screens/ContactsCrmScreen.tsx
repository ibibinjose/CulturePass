/**
 * Contacts CRM — saved CulturePass connections (device-local).
 */
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Platform,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInRight, useReducedMotion } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useDebounce } from '@/hooks/useDebounce';
import { FontFamily, InputTokens, Radius } from '@/design-system/tokens/theme';
import { M3TopAppBar, M3FAB } from '@/design-system/ui';
import { useSafeBack } from '@/lib/navigation';
import { useContacts } from '@/contexts/ContactsContext';
import type { SavedContact } from '@/repositories/ContactsRepository';
import { ApiError } from '@/modules/api';
import { ContactsSegmentTabs, type ContactsSegment } from '../components/ContactsSegmentTabs';
import { ContactListRow } from '../components/ContactListRow';
import { ContactsEmptyState } from '../components/ContactsEmptyState';
import { ContactsAddSheet } from '../components/ContactsAddSheet';
import { ContactsLookupDialog } from '../components/ContactsLookupDialog';
import { CONTACTS_CONTENT_MAX } from '../components/contactsLayout';
import { resolveContactFromCpid } from '../lib/resolveContactFromCpid';

const haptic = () => {
  if (Platform.OS !== 'web') void Haptics.selectionAsync();
};

export default function ContactsCrmScreen() {
  const colors = useColors();
  const goBackSafe = useSafeBack();
  const { hPad, isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const bottomInset = Platform.OS === 'web' ? 24 : insets.bottom;

  const { contacts, updateContact, clearContacts, addContact } = useContacts();

  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState<ContactsSegment>('all');
  const [lookupOpen, setLookupOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [lookupInput, setLookupInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const debouncedQuery = useDebounce(query.trim().toLowerCase(), 180);

  const filteredContacts = useMemo(() => {
    let list = [...contacts];

    if (segment === 'pinned') list = list.filter(c => c.pinned);
    else if (segment === 'notes') list = list.filter(c => (c.notes ?? '').trim().length > 0);

    if (debouncedQuery) {
      list = list.filter(c => {
        const haystack = [
          c.name,
          c.username,
          c.cpid,
          c.city,
          c.org,
          c.email,
          c.phone,
          ...(c.tags ?? []),
          c.notes,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(debouncedQuery);
      });
    }

    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const timeA = new Date(a.lastTouchedAt ?? a.savedAt).getTime();
      const timeB = new Date(b.lastTouchedAt ?? b.savedAt).getTime();
      return timeB - timeA;
    });
  }, [contacts, segment, debouncedQuery]);

  const stats = useMemo(
    () => ({
      total: contacts.length,
      pinned: contacts.filter(c => c.pinned).length,
      withNotes: contacts.filter(c => (c.notes ?? '').trim().length > 0).length,
    }),
    [contacts],
  );

  const segmentDefs = useMemo(
    () => [
      { key: 'all' as const, label: 'All', icon: 'people-outline' as const, count: stats.total },
      { key: 'pinned' as const, label: 'Pinned', icon: 'pin-outline' as const, count: stats.pinned },
      {
        key: 'notes' as const,
        label: 'Notes',
        icon: 'document-text-outline' as const,
        count: stats.withNotes,
      },
    ],
    [stats],
  );

  const onTogglePin = useCallback(
    (cpid: string, pinned: boolean) => {
      haptic();
      updateContact(cpid, { pinned: !pinned });
    },
    [updateContact],
  );

  const runLookup = useCallback(async () => {
    const raw = lookupInput.trim();
    if (raw.length < 2) {
      Alert.alert('Find someone', 'Enter at least 2 characters.');
      return;
    }
    setLookupLoading(true);
    try {
      const resolved = await resolveContactFromCpid(raw);
      if (!resolved) {
        Alert.alert('Not found', 'No member or profile matches that ID.');
        return;
      }
      addContact({ ...resolved, stage: 'new' });
      setLookupOpen(false);
      setLookupInput('');
      haptic();
      router.push({ pathname: '/contacts/[cpid]', params: { cpid: resolved.cpid } });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not find that profile.';
      Alert.alert('Not found', msg);
    } finally {
      setLookupLoading(false);
    }
  }, [lookupInput, addContact]);

  const onClearAll = useCallback(() => {
    if (!contacts.length) return;
    Alert.alert('Clear all contacts', 'This removes every saved contact from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: () => {
          haptic();
          clearContacts();
        },
      },
    ]);
  }, [contacts.length, clearContacts]);

  const openAdd = useCallback(() => {
    haptic();
    setAddMenuOpen(true);
  }, []);

  const headerActions = useMemo(() => {
    type Action = { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; label: string };
    const actions: Action[] = [
      { icon: 'person-add-outline', onPress: openAdd, label: 'Add connection' },
    ];
    if (contacts.length > 0) {
      actions.push({ icon: 'trash-outline', onPress: onClearAll, label: 'Clear all contacts' });
    }
    return actions;
  }, [contacts.length, openAdd, onClearAll]);

  const renderContactRow = useCallback(
    ({ item, index }: { item: SavedContact; index: number }) => (
      <Animated.View entering={reducedMotion ? undefined : FadeInRight.delay(index * 35).springify()}>
        <ContactListRow
          contact={item}
          onPress={() => {
            haptic();
            router.push({ pathname: '/contacts/[cpid]', params: { cpid: item.cpid } });
          }}
          onTogglePin={() => onTogglePin(item.cpid, !!item.pinned)}
        />
      </Animated.View>
    ),
    [onTogglePin, reducedMotion],
  );

  const contentWidth = {
    maxWidth: CONTACTS_CONTENT_MAX,
    alignSelf: 'center' as const,
    width: '100%' as const,
    paddingHorizontal: hPad,
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <M3TopAppBar
          title="Contacts"
          onBack={goBackSafe}
          actions={headerActions}
          variant="center-aligned"
        />

        <View style={[styles.toolbar, contentWidth]}>
          <Text style={[styles.summary, { color: colors.textSecondary }]}>
            {stats.total === 0
              ? 'Saved on this device'
              : `${stats.total} saved · ${stats.pinned} pinned`}
          </Text>

          <View style={[styles.search, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={18} color={colors.textTertiary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search name, handle, city…"
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.text }]}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Search contacts"
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  haptic();
                  router.push('/scanner');
                }}
                hitSlop={10}
                accessibilityLabel="Open scanner"
              >
                <Ionicons name="qr-code-outline" size={22} color={colors.primary} />
              </Pressable>
            )}
          </View>

          <ContactsSegmentTabs
            segment={segment}
            onSegmentChange={s => {
              haptic();
              setSegment(s);
            }}
            segments={segmentDefs}
          />
        </View>

        <FlatList
          style={styles.list}
          data={filteredContacts}
          keyExtractor={item => item.cpid}
          renderItem={renderContactRow}
          keyboardDismissMode="on-drag"
          contentContainerStyle={[
            contentWidth,
            {
              paddingTop: 8,
              paddingBottom: bottomInset + (isDesktop ? 32 : 88),
              flexGrow: 1,
            },
          ]}
          ListEmptyComponent={
            <ContactsEmptyState
              query={query}
              segment={segment}
              onScan={() => router.push('/scanner')}
              onLookup={() => setLookupOpen(true)}
            />
          }
        />
      </KeyboardAvoidingView>

      {!isDesktop && (
        <M3FAB icon="add" onPress={openAdd} style={[styles.fab, { bottom: bottomInset + 16 }]} />
      )}

      <ContactsAddSheet
        visible={addMenuOpen}
        isDesktop={isDesktop}
        onClose={() => setAddMenuOpen(false)}
        onScan={() => {
          setAddMenuOpen(false);
          router.push('/scanner');
        }}
        onLookup={() => {
          setAddMenuOpen(false);
          setLookupOpen(true);
        }}
      />

      <ContactsLookupDialog
        visible={lookupOpen}
        value={lookupInput}
        loading={lookupLoading}
        onChangeText={setLookupInput}
        onClose={() => setLookupOpen(false)}
        onSubmit={() => void runLookup()}
        onScan={() => {
          setLookupOpen(false);
          router.push('/scanner');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  toolbar: { gap: 12, paddingTop: 8, paddingBottom: 4 },
  summary: { fontSize: 13, fontFamily: FontFamily.medium, marginLeft: 2 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: InputTokens.height,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    ...Platform.select({ web: { outlineStyle: 'none' } as Record<string, unknown>, default: {} }),
  },
  list: { flex: 1 },
  fab: { position: 'absolute', right: 20 },
});
