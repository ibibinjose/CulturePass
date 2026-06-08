import { View, Text, Pressable, StyleSheet, Platform, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily, Radius } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { Button } from '@/design-system/ui/Button';
import { contactDisplayName } from '@/modules/contacts/lib/contactDisplayName';
import { CulturePassContact } from './types';

type Props = {
  contact: CulturePassContact;
  onClose: () => void;
  onSave: () => void;
  alreadySaved: boolean;
  onScanAnother: () => void;
};

export function CulturePassContactCard({
  contact,
  onClose,
  onSave,
  alreadySaved,
  onScanAnother,
}: Props) {
  const colors = useColors();
  const label = contactDisplayName({ ...contact, cpid: contact.cpid });
  const initial = label.replace(/^@/, '').charAt(0).toUpperCase();

  return (
    <Animated.View entering={FadeInUp.springify().damping(18)} style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <LinearGradient
          colors={Luxe.gradients.emeraldIndigo}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.strip}
        />

        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.close, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Dismiss"
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </Pressable>

        <View style={styles.body}>
          {contact.avatarUrl ? (
            <Image source={{ uri: contact.avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{initial}</Text>
            </View>
          )}

          <Text style={[styles.name, { color: colors.text }]}>{label}</Text>
          {contact.username && label !== `@${contact.username}` ? (
            <Text style={[styles.username, { color: colors.textSecondary }]}>@{contact.username}</Text>
          ) : null}

          <View style={styles.chips}>
            <View style={[styles.chip, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.chipText, { color: colors.text }]}>{contact.cpid}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: CultureTokens.gold + '18' }]}>
              <Text style={[styles.chipText, { color: CultureTokens.gold }]}>
                {(contact.tier || 'free').toUpperCase()}
              </Text>
            </View>
          </View>

          {(contact.city || contact.country) && (
            <View style={styles.location}>
              <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                {[contact.city, contact.country].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}

          {contact.bio ? (
            <Text style={[styles.bioText, { color: colors.textSecondary }]}>{contact.bio}</Text>
          ) : null}

          {(contact.email || contact.phone || contact.website) && (
            <View style={styles.linksSection}>
              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
              <Text style={[styles.linksTitle, { color: colors.textTertiary }]}>CONNECT & LINKS</Text>
              
              <View style={styles.linksGrid}>
                {contact.email ? (
                  <Pressable
                    style={[styles.linkBtn, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => Linking.openURL(`mailto:${contact.email}`)}
                  >
                    <Ionicons name="mail-outline" size={16} color={colors.primary} />
                    <Text style={[styles.linkBtnText, { color: colors.text }]} numberOfLines={1}>
                      {contact.email}
                    </Text>
                  </Pressable>
                ) : null}

                {contact.phone ? (
                  <Pressable
                    style={[styles.linkBtn, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                  >
                    <Ionicons name="call-outline" size={16} color={colors.primary} />
                    <Text style={[styles.linkBtnText, { color: colors.text }]} numberOfLines={1}>
                      {contact.phone}
                    </Text>
                  </Pressable>
                ) : null}

                {contact.website ? (
                  <Pressable
                    style={[styles.linkBtn, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => {
                      const url = contact.website!.startsWith('http') ? contact.website! : `https://${contact.website}`;
                      Linking.openURL(url);
                    }}
                  >
                    <Ionicons name="globe-outline" size={16} color={colors.primary} />
                    <Text style={[styles.linkBtnText, { color: colors.text }]} numberOfLines={1}>
                      {contact.website}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <Button
              variant="primary"
              fullWidth
              onPress={() => router.push({ pathname: '/contacts/[cpid]', params: { cpid: contact.cpid } })}
            >
              View profile
            </Button>
            <Button
              variant={alreadySaved ? 'outline' : 'secondary'}
              fullWidth
              onPress={onSave}
              disabled={alreadySaved}
              leftIcon={alreadySaved ? 'checkmark-circle' : 'person-add-outline'}
            >
              {alreadySaved ? 'Saved to contacts' : 'Add contact'}
            </Button>
            <Button variant="ghost" fullWidth onPress={onScanAnother} leftIcon="scan-outline">
              Scan another
            </Button>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.08)' } as Record<string, unknown>,
    }),
  },
  strip: { height: 4, width: '100%' },
  close: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 20,
    paddingTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: { fontSize: 28, fontFamily: FontFamily.bold },
  name: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  username: { fontSize: 15, fontFamily: FontFamily.medium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  chipText: { fontSize: 12, fontFamily: FontFamily.bold },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: { fontSize: 13, fontFamily: FontFamily.regular },
  actions: { width: '100%', gap: 10, marginTop: 16 },
  bioText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 8,
  },
  linksSection: {
    width: '100%',
    marginTop: 8,
    gap: 8,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 8,
  },
  linksTitle: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 2,
    marginBottom: 2,
  },
  linksGrid: {
    width: '100%',
    gap: 6,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    ...Platform.select({
      web: { cursor: 'pointer' } as Record<string, unknown>,
      default: {},
    }),
  },
  linkBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    flex: 1,
  },
});
