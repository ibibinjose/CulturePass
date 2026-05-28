import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Share,
  Alert,
  StyleSheet,
  Platform,
  Linking,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { Stack, useLocalSearchParams, usePathname, router } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '@/lib/query-client';
import { api } from '@/lib/api';
import { modulesApi, ApiError } from '@/modules/api';
import { useAuth } from '@/lib/auth';
import { useContacts } from '@/contexts/ContactsContext';
import { exportToAddressBook } from '@/modules/contacts/lib/exportContact';
import { isAppAdminEmail } from '@/lib/admin';
import { goBackOrReplace } from '@/lib/navigation';
import { userPublicSegment, siteUrl } from '@/lib/publicPaths';
import {
  profileShareDescription,
  profileShareImage,
  profileShareMessage,
  profileShareTitle,
} from '@/lib/profileShare';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { CultureTokens, SignatureGradient, FontFamily, Radius, Spacing } from '@/design-system/tokens/theme';
import { openExternalUrl } from '@/lib/openExternalUrl';
import type { User } from '@/shared/schema';
import { useColors, useIsDark } from '@/hooks/useColors';
import { M3Card } from '@/design-system/ui';

// ─── palette ─────────────────────────────────────────────────────────────────
const VIOLET   = CultureTokens.violet;
const CORAL    = CultureTokens.coral;
const TEAL     = '#00D4AA';
const PAGE_BG  = '#F4F0FF';
const CARD_BG  = '#FFFFFF';
const TEXT     = '#1C1C1E';
const MUTED    = '#8B8FA8';
const BORDER   = '#EEEAF6';
const FONT_BOLD = 'Poppins_700Bold';
const FONT_SEMI = 'Poppins_600SemiBold';
const FONT_MED  = 'Poppins_500Medium';
const FONT_REG  = 'Poppins_400Regular';

const SOCIAL_DEFS = [
  { key: 'instagram', icon: 'logo-instagram' as const, label: 'Instagram',   color: '#E1306C' },
  { key: 'twitter',   icon: 'logo-twitter'   as const, label: 'X / Twitter', color: '#1DA1F2' },
  { key: 'tiktok',    icon: 'logo-tiktok'    as const, label: 'TikTok',      color: '#69C9D0' },
  { key: 'youtube',   icon: 'logo-youtube'   as const, label: 'YouTube',     color: '#FF0000' },
  { key: 'linkedin',  icon: 'logo-linkedin'  as const, label: 'LinkedIn',    color: '#0A66C2' },
  { key: 'facebook',  icon: 'logo-facebook'  as const, label: 'Facebook',    color: '#1877F2' },
];

const TIER_CFG: Record<string, {
  color: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = {
  free:    { color: MUTED,     label: 'Standard', icon: 'shield-outline' },
  plus:    { color: TEAL,      label: 'Plus',     icon: 'star'           },
  pro:     { color: VIOLET,    label: 'Pro',      icon: 'flash'          },
  premium: { color: CORAL,     label: 'Premium',  icon: 'diamond'        },
  vip:     { color: '#FFB347', label: 'VIP',      icon: 'trophy'         },
};

const AVATAR_SIZE   = 88;
const AVATAR_BORDER = 4;
const COLUMN_MAX    = 520;

// ─── data ─────────────────────────────────────────────────────────────────────
async function resolveUser(rawId: string): Promise<User> {
  if (/^CP-[A-Z0-9]{6,}$/i.test(rawId)) {
    const lookup = await modulesApi.cpid.lookup(rawId);
    const targetUserId = (lookup?.userId ?? lookup?.targetId ?? rawId) as string;
    const user = await modulesApi.users.get(targetUserId) as User;
    return user.culturePassId ? user : { ...user, culturePassId: rawId.toUpperCase() };
  }
  return modulesApi.users.get(rawId) as Promise<User>;
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}
function initials(name: string) {
  return (name || 'U').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function memberDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

// ─── screen ───────────────────────────────────────────────────────────────────
function UserPublicScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const pathname = usePathname();
  const { id } = useLocalSearchParams<{ id: string }>();
  const rawId = String(id ?? '').trim();

  const { userId: currentUserId, user: currentUser } = useAuth();
  const { addContact, isContactSaved } = useContacts();
  const qc = useQueryClient();

  const colors = useColors();
  const isDark = useIsDark();

  // Rich multi-app Message / Call sheet (Link-in-bio style contact actions)
  const [contactSheet, setContactSheet] = useState<null | 'message' | 'call'>(null);

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['user-public', rawId],
    queryFn: () => resolveUser(rawId),
    enabled: !!rawId,
    retry: (count, err) => {
      if (err instanceof ApiError && (err.status === 404 || err.status === 403)) return false;
      return count < 2;
    },
  });

  // Safe canonical redirect — resolveUser always backfills culturePassId so this never loops.
  // Guard: only redirect when still on a /user/ path to avoid hijacking navigation away from this page.
  useEffect(() => {
    if (Platform.OS !== 'web' || isLoading || !user) return;
    if (!pathname.startsWith('/user/')) return;
    const segment = userPublicSegment(displayUser as any);
    const cur = pathname.replace(/\/$/, '');
    if (cur !== `/user/${segment}`) router.replace(`/user/${segment}` as never);
  }, [user, pathname, isLoading]);

  const isOwner = !!currentUserId && !!user && currentUserId === user.id;
  const isAdmin = isAppAdminEmail(currentUser?.email);
  const isPrivate = user?.privacySettings?.profileVisible === false && !isOwner && !isAdmin;

  // When viewing your own public profile, prefer the freshest avatar from live auth session
  // (fixes "image not updating after edit" for the /user/CP-... view)
  const displayUser = isOwner && currentUser
    ? { ...user, avatarUrl: currentUser.avatarUrl || user.avatarUrl }
    : user;

  const followQ = useQuery<boolean>({
    queryKey: ['is-following', 'user', user?.id],
    queryFn: () => api.social.isFollowing('user', user!.id),
    enabled: !!user && !isOwner && !!currentUserId,
  });
  const isFollowing = followQ.data ?? false;

  // === Security / Access Logging (anti-scraping / contact theft monitoring) ===
  // Fires a non-blocking report when a non-owner views the public profile.
  // These land in Admin → Reports / Audit Logs so you can see who (or what bot)
  // is accessing CPIDs and contact details.
  useEffect(() => {
    const targetId = displayUser?.id;
    if (!targetId || isOwner || !currentUserId) return;

    // Fire and forget — never block rendering
    (async () => {
      try {
        await api.reports?.submit?.({
          targetType: 'user',
          targetId,
          reason: 'profile_view',
          details: 'Public /user profile page loaded (possible contact scraping)',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        });
      } catch {
        // Silent — logging must never break the public profile experience
      }
    })();
  }, [displayUser?.id, isOwner, currentUserId]);

  const followMut = useMutation({
    mutationFn: ({ action }: { action: 'follow' | 'unfollow' }) =>
      action === 'follow'
        ? api.social.follow('user', user!.id)
        : api.social.unfollow('user', user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['is-following', 'user', user?.id] });
      qc.invalidateQueries({ queryKey: ['user-public', rawId] });
    },
  });

  const handleBack = () => goBackOrReplace('/(tabs)');

  const handleShare = async () => {
    if (!displayUser) return;
    const safeDu = displayUser as any;
    const url = siteUrl(`/user/${userPublicSegment(safeDu)}`);
    const title = profileShareTitle(safeDu);
    const text = profileShareDescription(safeDu);
    if (Platform.OS === 'web') {
      if (navigator.share) navigator.share({ title, text, url }).catch(() => {});
      else navigator.clipboard?.writeText(url).catch(() => {});
    } else if (Platform.OS === 'ios') {
      Share.share({ title, message: text, url }).catch(() => {});
    } else {
      Share.share({ title, message: profileShareMessage(safeDu as any) }).catch(() => {});
    }
  };

  const pageBg = colors.background;
  const cardBg = colors.surfaceElevated || colors.card;
  const textColor = colors.text;
  const mutedColor = colors.textTertiary;
  const borderColor = colors.cardBorder;
  const primaryColor = colors.primary;

  // ── loading ──
  if (isLoading) {
    return (
      <View style={[s.fill, s.center, { backgroundColor: pageBg }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  // ── not found ──
  if (error || !user) {
    return (
      <View style={[s.fill, s.center, { backgroundColor: pageBg }]}>
        <Ionicons name="person-outline" size={48} color={mutedColor} />
        <Text style={[s.emptyTitle, { color: textColor }]}>Profile not found</Text>
        <Pressable onPress={handleBack} style={[s.ghostBtn, { backgroundColor: primaryColor + '12' }]}>
          <Text style={[s.ghostBtnText, { color: primaryColor }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  // ── private ──
  if (isPrivate) {
    return (
      <View style={[s.fill, s.center, { backgroundColor: pageBg }]}>
        <Ionicons name="lock-closed" size={48} color={mutedColor} />
        <Text style={[s.emptyTitle, { color: textColor }]}>This profile is private</Text>
        <Text style={[s.emptyBody, { color: mutedColor }]}>{"Only followers can see this user's details."}</Text>
        <Pressable onPress={handleBack} style={[s.ghostBtn, { backgroundColor: primaryColor + '12' }]}>
          <Text style={[s.ghostBtnText, { color: primaryColor }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  // ── render data ──
  const du = displayUser || user!;
  const displayName = du.displayName ?? du.username ?? 'CulturePass member';

  // Contact methods for the rich Message / Call sheets
  const phoneNumber = du.phone?.trim();
  const emailAddress = du.email?.trim();

  const openExternal = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Cannot open', 'No compatible app found on this device.');
    });
    setContactSheet(null);
  };
  const ini = initials(displayName);
  const locationText = [du.city, du.country].filter(Boolean).join(', ');
  const memberSince = memberDate(du.createdAt);
  const cpid = du.culturePassId ?? `CP-${du.id.slice(0, 6).toUpperCase()}`;
  const alreadySaved = isContactSaved(cpid);
  const handleSaveContact = () => {
    if (alreadySaved) return;
    addContact({
      cpid,
      name: displayName,
      username: du?.username,
      avatarUrl: du?.avatarUrl,
      userId: du?.id,
      city: du?.city,
      country: du?.country,
      email: du?.email,
      phone: du?.phone,
      bio: du?.bio,
      website: du?.website,
      tier: du?.membership?.tier,
    });
  };

  const handleExportToPhone = async () => {
    try {
      const res = await exportToAddressBook({
        displayName: displayName,
        email: user?.email,
        phone: user?.phone,
        website: user?.website,
        city: user?.city,
        state: user?.state,
        country: user?.country,
        bio: user?.bio,
        cpid: cpid,
        membershipTier: user?.membership?.tier || 'free',
      });
      if (Platform.OS !== 'web') {
        Alert.alert(res.success ? 'Success' : 'Export Failed', res.message);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save contact to device.');
    }
  };
  const tier = user.membership?.tier ?? 'free';
  const tierConf = TIER_CFG[tier] ?? TIER_CFG.free;
  const socialLinks = (user.socialLinks ?? {}) as Record<string, string | undefined>;
  const activeSocials = SOCIAL_DEFS.filter((d) => socialLinks[d.key]);
  const tags = [
    ...(user.interests ?? []),
    ...(user.culturalIdentity?.cultureIds ?? []),
    ...(user.languages ?? []),
  ].filter(Boolean).slice(0, 14);
  const duForShare = displayUser || (user as any);
  const publicSegment = userPublicSegment(duForShare);
  const profileUrl = siteUrl(`/user/${publicSegment}`);
  // Clean "username" style URL when handle is approved (the nice option user asked for)
  const hasNiceHandle = !!(duForShare.handle && duForShare.handleStatus === 'approved');
  const niceUsername = hasNiceHandle ? duForShare.handle!.toLowerCase() : null;
  const nicePublicUrl = niceUsername ? siteUrl(`/${niceUsername}`) : profileUrl;
  const shareTitle = profileShareTitle(duForShare);
  const shareDescription = profileShareDescription(duForShare);
  const shareImage = profileShareImage(duForShare);

  return (
    <ErrorBoundary>
      <Stack.Screen options={{ headerShown: false, title: displayName }} />
      <Head>
        <title>{shareTitle}</title>
        <meta name="description" content={shareDescription} />
        <meta property="og:type" content="profile" />
        <meta property="og:site_name" content="CulturePass" />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:image:alt" content={`${displayName} profile on CulturePass`} />
        <meta property="og:url" content={profileUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={shareDescription} />
        <meta name="twitter:image" content={shareImage} />
        <meta name="twitter:url" content={profileUrl} />
        <link rel="canonical" href={profileUrl} />
      </Head>

      <View style={[s.fill, { backgroundColor: pageBg }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 48 }]}
        >
          {/*
            Single page card — maxWidth 520px, centred by the scroll's alignItems:center.
            Hero gradient lives INSIDE this container so it stretches to 520px, not
            the full content-area width. Back/share buttons stay within the card.
          */}
          <View style={[s.page, { backgroundColor: cardBg, borderColor }]}>
            {/* subtle border for web/desktop separation */}

            {/* hero gradient — fills the page card width */}
            <LinearGradient
              colors={SignatureGradient as unknown as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[s.heroStrip, { paddingTop: topInset + 10 }]}
            >
              <View style={s.heroNav}>
                <Pressable style={s.navBtn} onPress={handleBack} hitSlop={8}
                  accessibilityRole="button" accessibilityLabel="Go back">
                  <Ionicons name="chevron-back" size={20} color="#FFF" />
                </Pressable>
                <Pressable style={s.navBtn} onPress={handleShare} hitSlop={8}
                  accessibilityRole="button" accessibilityLabel="Share profile">
                  <Ionicons name="share-outline" size={18} color="#FFF" />
                </Pressable>
              </View>
              {/* space for the avatar to overlap */}
              <View style={{ height: AVATAR_SIZE / 2 + AVATAR_BORDER }} />
            </LinearGradient>

            {/* avatar — pulled up over the hero bottom edge */}
            <View style={s.avatarWrap}>
              <View style={s.avatarRing}>
                {displayUser?.avatarUrl ? (
                  <Image
                    source={{ uri: displayUser.avatarUrl }}
                    style={s.avatarImg}
                    contentFit="cover"
                    recyclingKey={(displayUser as any).updatedAt || (displayUser as any).avatarUpdatedAt || displayUser.id}
                    cachePolicy="none"
                  />
                ) : (
                  <LinearGradient
                    colors={[VIOLET, CORAL]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={s.avatarGradient}
                  >
                    <Text style={s.avatarText}>{ini}</Text>
                  </LinearGradient>
                )}
                {user.isVerified && (
                  <View style={s.verifiedBadge}>
                    <Ionicons name="checkmark" size={10} color="#FFF" />
                  </View>
                )}
              </View>
            </View>

            {/* content — padded, within the same 520px card */}
            <View style={s.column}>

            {/* identity */}
            <View style={s.identityBlock}>
              <Text style={s.displayName}>{displayName}</Text>
              {(user.handle ?? user.username) ? (
                <Text style={s.handle}>@{user.handle ?? user.username}</Text>
              ) : null}
              {locationText ? (
                <View style={s.metaRow}>
                  <Ionicons name="location-outline" size={13} color={MUTED} />
                  <Text style={s.metaText}>{locationText}</Text>
                </View>
              ) : null}

              <View style={[s.tierPill, { borderColor: tierConf.color + '50' }]}>
                <Ionicons name={tierConf.icon} size={12} color={tierConf.color} />
                <Text style={[s.tierText, { color: tierConf.color }]}>{tierConf.label} Member</Text>
                {memberSince ? <Text style={s.tierSince}> · {memberSince}</Text> : null}
              </View>

              <Pressable style={s.cpidPill}
                onPress={() => {
                  if (Platform.OS === 'web') navigator.clipboard?.writeText(cpid).catch(() => {});
                }}>
                <Ionicons name="finger-print" size={12} color={VIOLET} />
                <Text style={s.cpidText}>{cpid}</Text>
              </Pressable>
            </View>

            {/* action buttons */}
            {isOwner ? (
              <Pressable style={s.editBtn} onPress={() => router.push('/profile/edit')}>
                <Ionicons name="create-outline" size={16} color={primaryColor} />
                <Text style={[s.actionBtnText, { color: primaryColor }]}>Edit profile</Text>
              </Pressable>
            ) : currentUserId ? (
              <View style={{ gap: 10 }}>
                <View style={s.actionRow}> 
                  {/* Message - opens rich multi-app options (iMessage, WhatsApp, Email, in-app) */}
                  <Pressable 
                    style={s.msgBtn} 
                    onPress={() => setContactSheet('message')}
                  >
                    <Ionicons name="chatbubble-outline" size={15} color={TEXT} />
                    <Text style={[s.actionBtnText, { color: TEXT }]}>Message</Text>
                  </Pressable>

                  {/* New Call button with app-aware options */}
                  <Pressable 
                    style={[s.msgBtn, { backgroundColor: VIOLET + '10' }]} 
                    onPress={() => setContactSheet('call')}
                  >
                    <Ionicons name="call-outline" size={15} color={VIOLET} />
                    <Text style={[s.actionBtnText, { color: VIOLET }]}>Call</Text>
                  </Pressable>

                  <Pressable
                    style={[s.followBtn, isFollowing && s.followBtnDone]}
                    onPress={() => followMut.mutate({ action: isFollowing ? 'unfollow' : 'follow' })}
                    disabled={followMut.isPending}
                  >
                    <Ionicons
                      name={isFollowing ? 'checkmark' : 'person-add-outline'}
                      size={15}
                      color={isFollowing ? VIOLET : '#FFF'}
                    />
                    <Text style={[s.actionBtnText, { color: isFollowing ? VIOLET : '#FFF' }]}> 
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </Pressable>
                </View>

                {/* Save to Phone Address Book */}
                <Pressable
                  style={s.exportBtn}
                  onPress={handleExportToPhone}
                >
                  <Ionicons name="download-outline" size={16} color={VIOLET} />
                  <Text style={[s.actionBtnText, { color: VIOLET }]}>
                    Save to Phone Contacts
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* stats */}
            <View style={[s.statsCard, { backgroundColor: cardBg, borderColor }]}>
              <StatItem label="Followers" value={user.followersCount ?? 0} />
              <View style={[s.statDivider, { backgroundColor: borderColor }]} />
              <StatItem label="Following" value={user.followingCount ?? 0} />
              <View style={[s.statDivider, { backgroundColor: borderColor }]} />
              <StatItem label="Events"    value={user.eventsAttended  ?? 0} />
            </View>

            {/* bio */}
            {user.bio ? (
              <View style={[s.card, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[s.sectionLabel, { color: mutedColor }]}>About</Text>
                <Text style={[s.bioText, { color: textColor }]}>{user.bio}</Text>
              </View>
            ) : null}

            {/* Links & Contact section — Link-in-bio style */}
            <View style={{ marginTop: 20, marginBottom: 4 }}>
              <Text style={[s.sectionLabel, { color: primaryColor, fontSize: 13, letterSpacing: 1 }]}>CONNECT &amp; LINKS</Text>
            </View>

            {/* website */}
            {user.website ? (
              <Pressable style={[s.linkPill, { backgroundColor: cardBg, borderColor }]} onPress={() => openExternalUrl(user.website!)}>
                <View style={[s.linkIcon, { backgroundColor: primaryColor + '18' }]}>
                  <Ionicons name="globe-outline" size={18} color={primaryColor} />
                </View>
                <Text style={[s.linkLabel, { color: textColor }]} numberOfLines={1}>
                  {user.website.replace(/^https?:\/\//, '')}
                </Text>
                <Ionicons name="arrow-forward" size={15} color={mutedColor} />
              </Pressable>
            ) : null}

            {/* email */}
            {user.email ? (
              <Pressable style={[s.linkPill, { backgroundColor: cardBg, borderColor }]} onPress={() => openExternalUrl(`mailto:${user.email}`)}>
                <View style={[s.linkIcon, { backgroundColor: '#00D4AA18' }]}>
                  <Ionicons name="mail-outline" size={18} color="#00D4AA" />
                </View>
                <Text style={[s.linkLabel, { color: textColor }]} numberOfLines={1}>
                  {user.email}
                </Text>
                <Ionicons name="arrow-forward" size={15} color={mutedColor} />
              </Pressable>
            ) : null}

            {/* phone */}
            {user.phone ? (
              <Pressable style={[s.linkPill, { backgroundColor: cardBg, borderColor }]} onPress={() => openExternalUrl(`tel:${user.phone}`)}>
                <View style={[s.linkIcon, { backgroundColor: primaryColor + '18' }]}>
                  <Ionicons name="call-outline" size={18} color={primaryColor} />
                </View>
                <Text style={[s.linkLabel, { color: textColor }]} numberOfLines={1}>
                  {user.phone}
                </Text>
                <Ionicons name="arrow-forward" size={15} color={mutedColor} />
              </Pressable>
            ) : null}

            {/* social links */}
            {activeSocials.map((def) => {
              const url = socialLinks[def.key];
              return (
                <Pressable key={def.key} style={[s.linkPill, { backgroundColor: cardBg, borderColor }]}
                  onPress={() => url && openExternalUrl(url)}>
                  <View style={[s.linkIcon, { backgroundColor: def.color + '18' }]}>
                    <Ionicons name={def.icon} size={18} color={def.color} />
                  </View>
                  <Text style={[s.linkLabel, { color: textColor }]}>{def.label}</Text>
                  <Ionicons name="arrow-forward" size={15} color={mutedColor} />
                </Pressable>
              );
            })}

            {/* culture tags */}
            {tags.length > 0 ? (
              <View style={[s.card, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[s.sectionLabel, { color: mutedColor }]}>Culture signals</Text>
                <View style={s.tagsWrap}>
                  {tags.map((tag) => (
                    <View key={tag} style={[s.tag, { backgroundColor: primaryColor + '10', borderColor: primaryColor + '25' }]}>
                      <Text style={[s.tagText, { color: primaryColor }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Prominent public URL / username option (clean culturepass.app/username) */}
            <M3Card variant="filled" style={[s.publicUrlCard, { backgroundColor: colors.surface, borderColor }]}>
              <View style={s.publicUrlHeader}>
                <Ionicons name="link-outline" size={16} color={primaryColor} />
                <Text style={[s.publicUrlLabel, { color: mutedColor }]}>Public link</Text>
              </View>
              <Pressable
                style={s.publicUrlRow}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    navigator.clipboard?.writeText(nicePublicUrl || '').catch(() => {});
                  } else {
                    Share.share({ message: nicePublicUrl || '' }).catch(() => {});
                  }
                }}
              >
                <Text style={[s.publicUrlValue, { color: textColor }]} numberOfLines={1}>
                  {nicePublicUrl.replace(/^https?:\/\//, '')}
                </Text>
                <Ionicons name="copy-outline" size={18} color={primaryColor} />
              </Pressable>
              {niceUsername ? (
                <Text style={[s.publicUrlHint, { color: mutedColor }]}>
                  Also reachable as {nicePublicUrl.replace(/^https?:\/\//, '')}
                </Text>
              ) : (
                <Text style={[s.publicUrlHint, { color: mutedColor }]}>
                  Share your CPID or set a handle in Edit Profile for a cleaner link
                </Text>
              )}
            </M3Card>

            {/* ── Rich Contact Action Sheet (Message + Call with apps on the device) ── */}
            <Modal
              visible={!!contactSheet}
              transparent
              animationType="slide"
              onRequestClose={() => setContactSheet(null)}
            >
              <Pressable 
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} 
                onPress={() => setContactSheet(null)} 
              />
              <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: colors.surfaceElevated || '#fff',
                borderTopLeftRadius: 22,
                borderTopRightRadius: 22,
                paddingBottom: insets.bottom + 24,
                paddingTop: 8,
              }}>
                <Text style={{ 
                  fontSize: 17, 
                  fontFamily: FontFamily.semibold, 
                  color: colors.text, 
                  textAlign: 'center',
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderColor: colors.borderLight
                }}>
                  {contactSheet === 'message' ? 'Choose messaging method' : 'Choose calling method'}
                </Text>

                {/* Dynamic options */}
                {contactSheet === 'message' && (
                  <>
                    {currentUserId && (
                      <Pressable onPress={() => { setContactSheet(null); router.push('/network' as never); }} style={s.contactOption}>
                        <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.text} />
                        <Text style={s.contactOptionText}>Message on CulturePass</Text>
                      </Pressable>
                    )}
                    {phoneNumber && (
                      <Pressable onPress={() => openExternal(`sms:${phoneNumber}`)} style={s.contactOption}>
                        <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
                        <Text style={s.contactOptionText}>{Platform.OS === 'ios' ? 'iMessage / SMS' : 'Text Message'}</Text>
                      </Pressable>
                    )}
                    {phoneNumber && (
                      <Pressable onPress={() => openExternal(`https://wa.me/${phoneNumber.replace(/\D/g,'')}`)} style={s.contactOption}>
                        <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                        <Text style={s.contactOptionText}>WhatsApp</Text>
                      </Pressable>
                    )}
                    {emailAddress && (
                      <Pressable onPress={() => openExternal(`mailto:${emailAddress}`)} style={s.contactOption}>
                        <Ionicons name="mail-outline" size={22} color={colors.text} />
                        <Text style={s.contactOptionText}>Email</Text>
                      </Pressable>
                    )}
                  </>
                )}

                {contactSheet === 'call' && (
                  <>
                    {phoneNumber && (
                      <Pressable onPress={() => openExternal(`tel:${phoneNumber}`)} style={s.contactOption}>
                        <Ionicons name="call-outline" size={22} color={colors.text} />
                        <Text style={s.contactOptionText}>Phone Call</Text>
                      </Pressable>
                    )}
                    {phoneNumber && (
                      <Pressable onPress={() => openExternal(`https://wa.me/${phoneNumber.replace(/\D/g,'')}?call`)} style={s.contactOption}>
                        <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                        <Text style={s.contactOptionText}>WhatsApp Call</Text>
                      </Pressable>
                    )}
                    {phoneNumber && Platform.OS === 'ios' && (
                      <Pressable onPress={() => openExternal(`facetime:${phoneNumber}`)} style={s.contactOption}>
                        <Ionicons name="videocam-outline" size={22} color="#007AFF" />
                        <Text style={s.contactOptionText}>FaceTime</Text>
                      </Pressable>
                    )}
                  </>
                )}

                <Pressable onPress={() => setContactSheet(null)} style={[s.contactOption, { justifyContent: 'center', marginTop: 8 }]}>
                  <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Cancel</Text>
                </Pressable>
              </View>
            </Modal>

            {/* CulturePass ID card */}
            <LinearGradient
              colors={['#0040B8', '#8800AA', '#C40060']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.cpidCard}
            >
              {/* Yellow top stripe */}
              <LinearGradient
                colors={['#FFD000', '#FFAA00']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.cpidAccent}
              />
              {/* Diagonal shimmer */}
              <LinearGradient
                colors={['rgba(255,255,255,0.09)', 'transparent', 'rgba(255,255,255,0.04)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              {/* Brand row */}
              <View style={s.cpidBrandRow}>
                <View style={s.cpidBrandDot} />
                <Text style={s.cpidBrand}>CulturePass</Text>
                <Ionicons name="finger-print" size={16} color="#FF80C8CC" />
              </View>

              {/* Body: QR left · identity right */}
              <View style={s.cpidBody}>
                <Pressable
                  onPress={() => { router.push('/profile/qr'); }}
                  accessibilityRole="button"
                  accessibilityLabel="Open QR code"
                >
                  <View style={s.cpidQrInner}>
                    <QRCode
                      value={JSON.stringify({ type: 'culturepass_id', cpid })}
                      size={96}
                      color="#0F172A"
                      backgroundColor="#FFFFFF"
                      ecl="H"
                    />
                  </View>
                </Pressable>

                <View style={s.cpidInfo}>
                  <Text style={s.cpidIdLabel}>CulturePass ID</Text>
                  <Text style={s.cpidIdValue} numberOfLines={1}>{cpid}</Text>
                  <Text style={s.cpidInfoName} numberOfLines={1}>{displayName}</Text>
                  <Text style={s.cpidInfoMeta}>
                    {tierConf.label}{memberSince ? ` · ${memberSince}` : ''}
                  </Text>
                </View>
              </View>
            </LinearGradient>

          </View>
          </View>{/* end page card */}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.statItem}>
      <Text style={s.statNum}>{fmt(value)}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export default function UserProfilePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserPublicScreen />
    </QueryClientProvider>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const CARD_RADIUS = 20;

const shadow = Platform.select({
  web: { boxShadow: '0 2px 12px rgba(0,0,0,0.07)' } as object,
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
});

const s = StyleSheet.create({
  fill:   { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40 },

  emptyTitle:   { fontFamily: FONT_BOLD, fontSize: 18, color: TEXT, textAlign: 'center' },
  emptyBody:    { fontFamily: FONT_REG,  fontSize: 14, color: MUTED, textAlign: 'center' },
  ghostBtn:     { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 50,
                  backgroundColor: VIOLET + '12', marginTop: 4 },
  ghostBtnText: { fontFamily: FONT_SEMI, fontSize: 14 },

  // scroll centres the page card
  scroll: { alignItems: 'center' },

  // single constrained card — hero + avatar + content all inside
  page: {
    width: '100%',
    maxWidth: COLUMN_MAX,
    ...Platform.select({
      web: { boxShadow: '0 8px 40px rgba(100,60,200,0.10)' } as object,
      default: {},
    }),
  },

  // hero fills the card width naturally (no explicit width needed)
  heroStrip: { paddingBottom: 0 },
  heroNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  navBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center', justifyContent: 'center',
  },

  // avatar centred within the card, overlapping the hero bottom
  avatarWrap: {
    alignItems: 'center',
    marginTop: -(AVATAR_SIZE / 2 + AVATAR_BORDER),
  },
  avatarRing: {
    width:  AVATAR_SIZE + AVATAR_BORDER * 2,
    height: AVATAR_SIZE + AVATAR_BORDER * 2,
    borderRadius: (AVATAR_SIZE + AVATAR_BORDER * 2) / 2,
    backgroundColor: PAGE_BG,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(147,51,234,0.25)' } as object,
      default: {
        shadowColor: VIOLET,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
      },
    }),
  },
  avatarImg: {
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarGradient: {
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:   { fontFamily: FONT_BOLD, fontSize: 30, color: '#FFF', letterSpacing: 1 },
  verifiedBadge: {
    position: 'absolute', bottom: 4, right: 4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: TEAL,
    borderWidth: 2.5, borderColor: PAGE_BG,
    alignItems: 'center', justifyContent: 'center',
  },

  // content padding within the page card
  column: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },

  // identity
  identityBlock: { alignItems: 'center', gap: 6, paddingTop: 4 },
  displayName:   { fontFamily: FONT_BOLD, fontSize: 24, color: TEXT, textAlign: 'center', letterSpacing: -0.4 },
  handle:        { fontFamily: FONT_MED, fontSize: 14, color: MUTED },
  metaRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:      { fontFamily: FONT_REG, fontSize: 13, color: MUTED },
  tierPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 4, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 50, borderWidth: 1.5, backgroundColor: CARD_BG,
  },
  tierText:  { fontFamily: FONT_MED, fontSize: 12 },
  tierSince: { fontFamily: FONT_REG, fontSize: 11, color: MUTED },
  cpidPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: VIOLET + '10',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50,
  },
  cpidText: { fontFamily: FONT_MED, fontSize: 12, color: VIOLET, letterSpacing: 0.5 },

  // action buttons
  actionRow: { flexDirection: 'row', gap: 10 },
  followBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 13, borderRadius: 14,
    backgroundColor: VIOLET,
  },
  followBtnDone: {
    backgroundColor: VIOLET + '14',
    borderWidth: 1.5, borderColor: VIOLET + '50',
  },
  msgBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 13, borderRadius: 14,
    backgroundColor: CARD_BG, borderWidth: 1.5, borderColor: BORDER,
    ...shadow,
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 13, borderRadius: 14,
    backgroundColor: VIOLET + '10', borderWidth: 1.5, borderColor: VIOLET + '30',
  },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 13, borderRadius: 14,
    backgroundColor: VIOLET + '10', borderWidth: 1.5, borderColor: VIOLET + '30',
  },
  actionBtnText: { fontFamily: FONT_SEMI, fontSize: 14 },

  // stats
  statsCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD_BG, borderRadius: CARD_RADIUS,
    paddingVertical: 16, paddingHorizontal: 8,
    ...shadow,
  },
  statItem:   { flex: 1, alignItems: 'center', gap: 2 },
  statNum:    { fontFamily: FONT_BOLD, fontSize: 22, color: TEXT, letterSpacing: -0.5 },
  statLabel:  { fontFamily: FONT_REG, fontSize: 11, color: MUTED, letterSpacing: 0.3,
                textTransform: 'uppercase' },
  statDivider:{ width: 1, height: 32, backgroundColor: BORDER },

  // cards
  card: {
    backgroundColor: CARD_BG, borderRadius: CARD_RADIUS,
    padding: 18, gap: 10, ...shadow,
  },
  sectionLabel: {
    fontFamily: FONT_SEMI, fontSize: 11, color: MUTED,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2,
  },
  bioText: { fontFamily: FONT_REG, fontSize: 15, color: TEXT, lineHeight: 24 },

  // link pills
  linkPill: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: CARD_BG, borderRadius: CARD_RADIUS,
    padding: 14, ...shadow,
  },
  linkIcon:  { width: 42, height: 42, borderRadius: 12,
               alignItems: 'center', justifyContent: 'center' },
  linkLabel: { flex: 1, fontFamily: FONT_SEMI, fontSize: 15, color: TEXT },

  // culture tags
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 50, backgroundColor: VIOLET + '10',
    borderWidth: 1, borderColor: VIOLET + '25',
  },
  tagText: { fontFamily: FONT_MED, fontSize: 12, color: VIOLET },

  // CulturePass ID card
  cpidCard: {
    borderRadius: CARD_RADIUS,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 22,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 14px 48px rgba(0,64,184,0.48)' } as object,
      default: {
        shadowColor: '#0040B8',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.48, shadowRadius: 28, elevation: 14,
      },
    }),
  },
  cpidAccent:    { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  cpidBrandRow:  { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 18 },
  cpidBrandDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF80C8', flexShrink: 0 },
  cpidBrand:     { fontFamily: FONT_BOLD, fontSize: 13, color: '#FFF', letterSpacing: 0.5, flex: 1 },
  cpidBody:      { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  cpidQrInner:   { backgroundColor: '#FFFFFF', padding: 7, borderRadius: 10, flexShrink: 0 },
  cpidInfo:      { flex: 1, gap: 3, paddingTop: 1 },
  cpidIdLabel:   { fontFamily: FONT_MED, fontSize: 8, color: '#80C8FF',
                   letterSpacing: 3.5, textTransform: 'uppercase' },
  cpidIdValue:   { fontFamily: FONT_BOLD, fontSize: 20, color: '#FFD000',
                   letterSpacing: 2, marginTop: 2 },
  cpidInfoName:  { fontFamily: FONT_SEMI, fontSize: 14, color: '#FFF',
                   letterSpacing: 0.2, marginTop: 10 },
  cpidInfoMeta:  { fontFamily: FONT_MED, fontSize: 11, color: '#FF90D0',
                   letterSpacing: 0.2, marginTop: 2 },

  // Public URL / username option card (new)
  publicUrlCard: {
    marginTop: 16,
    marginBottom: 8,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  publicUrlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  publicUrlLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  publicUrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  publicUrlValue: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    flex: 1,
  },
  publicUrlHint: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    marginTop: 2,
  },

  // Rich Message / Call action sheet options
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 17,
    gap: 14,
    borderTopWidth: 1,
    borderColor: '#00000010',
  },
  contactOptionText: {
    flex: 1,
    fontSize: 17,
    fontFamily: FONT_REG,
  },
});
