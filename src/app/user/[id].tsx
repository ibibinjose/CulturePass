import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  Animated,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { Stack, useLocalSearchParams, usePathname, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { modulesApi, ApiError } from '@/modules/api';
import { useAuth } from '@/lib/auth';
import { useContacts } from '@/contexts/ContactsContext';
import { exportToAddressBook } from '@/modules/contacts/lib/exportContact';
import { isAppAdminEmail } from '@/lib/admin';
import { goBackOrReplace } from '@/lib/navigation';
import { siteUrl, canonicalUserPath, canonicalCPUPath } from '@/lib/publicPaths';
import {
  profileShareDescription,
  profileShareImage,
  profileShareTitle,
} from '@/lib/profileShare';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { CultureTokens } from '@/design-system/tokens/theme';
import { openExternalUrl } from '@/lib/openExternalUrl';
import type { User, Profile, EventData } from '@/shared/schema';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { USER_PUBLIC_PROFILE as UP } from '@/design-system/tokens/userPublicProfileOverlay';
import { CP } from '@/modules/profile/components/user/profileUtils';
import { fmt, initials, memberDate, TIER_CFG, SOCIAL_DEFS } from '@/modules/profile/components/tabs/ProfileUtils';
import {
  getStyles,
  swipeStyles,
  statItemStyles,
  AVATAR_SIZE,
  capitalize,
} from '@/modules/profile/components/user/userPublicScreenStyles';

// ─── data ─────────────────────────────────────────────────────────────────────
async function resolveUser(rawId: string): Promise<User> {
  if (/^CP-[A-Z0-9]{6,}$/i.test(rawId)) {
    const lookup = await modulesApi.cpid.lookup(rawId);
    const targetUserId = (lookup?.userId ?? lookup?.targetId ?? rawId) as string;
    const user = await modulesApi.users.get(targetUserId) as User;
    return user.culturePassId ? user : { ...user, culturePassId: rawId.toUpperCase() };
  }
  try {
    return await (modulesApi.users.get(rawId) as Promise<User>);
  } catch (e: any) {
    // Fallback: support direct /user/<handle> or /cpu/<username> links
    const byHandle = await modulesApi.users.getByHandle(rawId).catch(() => null);
    if (byHandle?.id) return byHandle as User;
    throw e;
  }
}

// ─── screen ───────────────────────────────────────────────────────────────────
function UserPublicScreen() {
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const pathname = usePathname();
  const { id } = useLocalSearchParams<{ id: string }>();
  const rawId = String(id ?? '').trim();

  const { userId: currentUserId, user: currentUser } = useAuth();
  const { addContact, isContactSaved } = useContacts();
  const qc = useQueryClient();

  const colors = useColors();
  const isDark = useIsDark();
  const layout = useLayout();

  // Dynamic colors (replaces old broken TEXT/MUTED/PAGE_BG etc.)
  const textColor = colors.text;
  const mutedColor = colors.textSecondary;
  const cardBg = colors.surface;
  const pageBg = isDark ? colors.background : UP.pageBgLight;
  const borderColor = colors.borderLight;
  const primaryColor = CultureTokens.violet;

  const s = getStyles(colors, isDark);

  // Rich multi-app Message / Call sheet (Link-in-bio style contact actions)
  const [contactSheet, setContactSheet] = useState<null | 'message' | 'call'>(null);
  const [copied, setCopied] = useState(false);

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['user-public', rawId],
    queryFn: () => resolveUser(rawId),
    enabled: !!rawId,
    retry: (count, err) => {
      if (err instanceof ApiError && (err.status === 404 || err.status === 403)) return false;
      return count < 2;
    },
  });

  // When viewing your own public profile, prefer the freshest avatar from live auth session
  // (fixes "image not updating after edit" for the /user/CP-... view)
  // Memoized early so it can be safely used in effects without TDZ or unstable conditional deps.
  const displayUser = useMemo(() => {
    const owner = !!currentUserId && !!user && currentUserId === user.id;
    return (owner && currentUser)
      ? { ...user, avatarUrl: currentUser.avatarUrl || user?.avatarUrl }
      : user;
  }, [user, currentUserId, currentUser]);

  const isOwner = !!currentUserId && !!user && currentUserId === user.id;

  // General canonical enforcer (cleanup): snap whatever entrypoint (/user/, /cpu/, /u/ or bare) to the preferred /cpu/ public URL (for /cpu/username support, correct og:url in metadata for shares, business card profile image in previews, and security logs).
  // Delegation on alias routes means we render under the visited branded path; this effect keeps the bar + canonicals consistent.
  useEffect(() => {
    if (Platform.OS !== 'web' || isLoading || !user) return;

    // Only redirect when still on a user/cpu/u profile path — don't hijack navigation away from this page.
    const lowerPath = pathname.toLowerCase();
    const userKeys = [
      user.id,
      user.username,
      user.culturePassId,
      rawId
    ].filter((k): k is string => Boolean(k)).map(k => k.toLowerCase());

    const isProfilePath = userKeys.some(key =>
      lowerPath === `/cpu/${key}` ||
      lowerPath === `/user/${key}` ||
      lowerPath === `/u/${key}` ||
      lowerPath === `/${key}`
    );

    if (!isProfilePath) return;

    const preferred = canonicalUserPath(displayUser as any);
    const cur = pathname.replace(/\/$/, '');
    if (cur !== preferred) {
      router.replace(preferred as never);
    }
  }, [user, pathname, isLoading, displayUser, rawId]);

  const isAdmin = isAppAdminEmail(currentUser?.email);
  const isPrivate = user?.privacySettings?.profileVisible === false && !isOwner && !isAdmin;

  const followQ = useQuery<boolean>({
    queryKey: ['is-following', 'user', user?.id],
    queryFn: () => api.social.isFollowing('user', user!.id),
    enabled: !!user && !isOwner && !!currentUserId,
  });
  const isFollowing = followQ.data ?? false;

  // Fetch profiles owned by this user
  const { data: userProfiles = [] } = useQuery({
    queryKey: ['user-profiles', user?.id],
    queryFn: () => modulesApi.profiles.list({ ownerId: user?.id, pageSize: 50 }),
    enabled: !!user?.id,
  });

  // Fetch events organized by this user
  const { data: userEventsData } = useQuery({
    queryKey: ['user-events', user?.id],
    queryFn: () => modulesApi.events.list({ organizerId: user?.id, pageSize: 20 }),
    enabled: !!user?.id,
  });
  const userEvents = userEventsData?.events ?? [];

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
          details: 'Public /user or /cpu profile page loaded (possible contact scraping)',
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
    const url = siteUrl(canonicalUserPath(safeDu));
    const title = profileShareTitle(safeDu);
    const cpidText = cpid ? ` · ${cpid}` : '';
    const text = `${profileShareDescription(safeDu)}\n\n🪪 Digital Business Pass${cpidText}\n${url}`;
    if (Platform.OS === 'web') {
      if (navigator.share) navigator.share({ title, text: profileShareDescription(safeDu), url }).catch(() => { });
      else navigator.clipboard?.writeText(url).catch(() => { });
    } else if (Platform.OS === 'ios') {
      Share.share({ title, message: text, url }).catch(() => { });
    } else {
      Share.share({ title, message: text }).catch(() => { });
    }
  };

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
        <Text style={[s.emptyTitle, { color: textColor }]} numberOfLines={1}>Profile not found</Text>
        <Pressable onPress={handleBack} style={[s.ghostBtn, { backgroundColor: primaryColor + '12' }]}>
          <Text style={[s.ghostBtnText, { color: primaryColor }]} numberOfLines={1}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  // ── private ──
  if (isPrivate) {
    return (
      <View style={[s.fill, s.center, { backgroundColor: pageBg }]}>
        <Ionicons name="lock-closed" size={48} color={mutedColor} />
        <Text style={[s.emptyTitle, { color: textColor }]} numberOfLines={1}>This profile is private</Text>
        <Text style={[s.emptyBody, { color: mutedColor }]} numberOfLines={2}>{"Only followers can see this user's details."}</Text>
        <Pressable onPress={handleBack} style={[s.ghostBtn, { backgroundColor: primaryColor + '12' }]}>
          <Text style={[s.ghostBtnText, { color: primaryColor }]} numberOfLines={1}>Go back</Text>
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
  const handleCopy = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await Clipboard.setStringAsync(cpid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };
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
      // Save internally to the app's CRM contact repository
      handleSaveContact();

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
  // Use canonical helpers (post-cleanup for /cpu/username etc)
  const profileUrl = siteUrl(canonicalUserPath(duForShare));
  const cpuPublicUrl = siteUrl(canonicalCPUPath(duForShare));

  // Keep for render/QR that reference them (will show cpu branded in bottom card)
  const hasNiceHandle = !!(duForShare.handle && duForShare.handleStatus === 'approved');
  const niceUsername = hasNiceHandle ? duForShare.handle!.toLowerCase() : null;
  const nicePublicUrl = niceUsername
    ? siteUrl(`/${niceUsername}`)
    : cpuPublicUrl;
  const shareTitle = profileShareTitle(duForShare);
  const shareDescription = profileShareDescription(duForShare);
  const shareImage = profileShareImage(duForShare);

  return (
    <ErrorBoundary>
      <Stack.Screen options={{ headerShown: false, title: displayName }} />
      <Head>
        <title>{shareTitle}</title>
        <meta name="description" content={shareDescription} />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <meta property="og:type" content="profile" />
        <meta property="og:profile:username" content={duForShare.handle ?? duForShare.username ?? ''} />
        <meta property="og:site_name" content="CulturePass" />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${displayName} — Digital Business Pass on CulturePass`} />
        <meta property="og:url" content={profileUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@culturepassapp" />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={shareDescription} />
        <meta name="twitter:image" content={shareImage} />
        <meta name="twitter:image:alt" content={`${displayName} — Digital Business Pass on CulturePass`} />
        <meta name="twitter:url" content={profileUrl} />
        <link rel="canonical" href={profileUrl} />
        {/* Person structured data — helps Google Knowledge Panel for public profiles */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: displayName,
              identifier: cpid,
              url: profileUrl,
              image: shareImage,
              description: shareDescription,
              ...(duForShare.handle && duForShare.handleStatus === 'approved'
                ? { alternateName: `@${duForShare.handle}` }
                : {}),
              ...(locationText ? { homeLocation: { '@type': 'Place', name: locationText } } : {}),
              ...(duForShare.website ? { sameAs: [duForShare.website] } : {}),
              memberOf: {
                '@type': 'Organization',
                name: 'CulturePass',
                url: 'https://culturepass.app',
              },
            }),
          }}
        />
      </Head>

      <View style={[s.fill, { backgroundColor: pageBg }]}>
        {/* Improved subtle luxe background gradient + soft pattern */}
        <LinearGradient
          colors={[pageBg, primaryColor + '06', pageBg]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Very subtle diagonal accent for depth */}
        <LinearGradient
          colors={['transparent', primaryColor + '03', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scrollContent, { paddingBottom: safeInsets.bottom + 80 }]}
        >
          <View style={[
            s.page,
            {
              backgroundColor: cardBg,
              borderColor,
              maxWidth: layout.isDesktop ? 580 : '100%',
              alignSelf: 'center'
            }
          ]}>
            {/* Hero gradient strip */}
            <LinearGradient
              colors={[UP.heroBanner, UP.heroBanner]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[s.heroStrip, { paddingTop: topInset + 12 }]}
            >
              <View style={s.heroNav}>
                <Pressable style={s.navBtn} onPress={handleBack} hitSlop={8}>
                  <Ionicons name="chevron-back" size={20} color={UP.onHero} />
                </Pressable>
                <Pressable style={s.navBtn} onPress={handleShare} hitSlop={8}>
                  <Ionicons name="share-outline" size={18} color={UP.onHero} />
                </Pressable>
              </View>
              <View style={[s.heroSpacer, { height: AVATAR_SIZE / 2 + 8 }]} />
            </LinearGradient>

            {/* Modern Hero Avatar Section */}
            <View style={s.avatarSection}>
              <View style={s.avatarWrapper}>
                <View style={[s.avatarRing, {
                  borderColor: primaryColor + '25',
                  shadowColor: primaryColor,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 6
                }]}>
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
                      colors={[primaryColor, CultureTokens.coral]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={s.avatarGradient}
                    >
                      <Text style={s.avatarText} numberOfLines={1}>{ini}</Text>
                    </LinearGradient>
                  )}
                </View>

                {user.isVerified && (
                  <View style={s.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={22} color={UP.verified} />
                    <View style={s.verifiedInner} />
                  </View>
                )}
              </View>
            </View>

            {/* content — padded, within the same 520px card */}
            <View style={s.column}>

              {/* identity */}
              <View style={s.identityBlock}>
                <Text style={s.displayName} numberOfLines={2}>{displayName}</Text>
                {(user.handle ?? user.username) ? (
                  <Text style={s.handle} numberOfLines={1}>@{user.handle ?? user.username}</Text>
                ) : null}
                {locationText ? (
                  <View style={s.metaRow}>
                    <Ionicons name="location-outline" size={13} color={mutedColor} />
                    <Text style={s.metaText} numberOfLines={1}>{locationText}</Text>
                  </View>
                ) : null}

                <View style={[s.tierPill, { borderColor: tierConf.color + '50' }]}>
                  <Ionicons name={tierConf.icon} size={12} color={tierConf.color} />
                  <Text style={[s.tierText, { color: tierConf.color }]} numberOfLines={1}>{tierConf.label} Member</Text>
                  {memberSince ? <Text style={s.tierSince} numberOfLines={1}> · {memberSince}</Text> : null}
                </View>

                <Pressable style={s.cpidPill}
                  onPress={() => {
                    if (Platform.OS === 'web') navigator.clipboard?.writeText(cpid).catch(() => { });
                  }}>
                  <Ionicons name="finger-print" size={12} color={CultureTokens.violet} />
                  <Text style={s.cpidText} numberOfLines={1}>{cpid}</Text>
                </Pressable>
              </View>

              {/* action buttons */}
              {currentUserId && !isOwner ? (
                <View style={s.actionGroup}>
                  <View style={s.actionRow}>
                    {/* Message - opens rich multi-app options (iMessage, WhatsApp, Email, in-app) */}
                    <Pressable
                      style={s.msgBtn}
                      onPress={() => setContactSheet('message')}
                    >
                      <Ionicons name="chatbubble-outline" size={15} color={textColor} />
                      <Text style={[s.actionBtnText, { color: textColor }]} numberOfLines={1}>Message</Text>
                    </Pressable>

                    {/* New Call button with app-aware options */}
                    <Pressable
                      style={[s.msgBtn, { backgroundColor: CultureTokens.violet + '10' }]}
                      onPress={() => setContactSheet('call')}
                    >
                      <Ionicons name="call-outline" size={15} color={CultureTokens.violet} />
                      <Text style={[s.actionBtnText, { color: CultureTokens.violet }]} numberOfLines={1}>Call</Text>
                    </Pressable>

                    <Pressable
                      style={[s.followBtn, isFollowing && s.followBtnDone]}
                      onPress={() => followMut.mutate({ action: isFollowing ? 'unfollow' : 'follow' })}
                      disabled={followMut.isPending}
                    >
                      <Ionicons
                        name={isFollowing ? 'checkmark' : 'person-add-outline'}
                        size={15}
                        color={isFollowing ? CultureTokens.violet : UP.onHero}
                      />
                      <Text style={[s.actionBtnText, { color: isFollowing ? CultureTokens.violet : UP.onHero }]} numberOfLines={1}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Save to Phone Address Book */}
                  <Pressable
                    style={s.exportBtn}
                    onPress={handleExportToPhone}
                  >
                    <Ionicons name="download-outline" size={16} color={CultureTokens.violet} />
                    <Text style={[s.actionBtnText, { color: CultureTokens.violet }]} numberOfLines={1}>
                      Save to Phone Contacts
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {/* stats */}
              <View style={[s.statsCard, { backgroundColor: cardBg, borderColor }]}>
                <StatItem label="Followers" value={user.followersCount ?? 0} textColor={textColor} mutedColor={mutedColor} />
                <View style={[s.statDivider, { backgroundColor: borderColor }]} />
                <StatItem label="Following" value={user.followingCount ?? 0} textColor={textColor} mutedColor={mutedColor} />
                <View style={[s.statDivider, { backgroundColor: borderColor }]} />
                <StatItem label="Events" value={user.eventsAttended ?? 0} textColor={textColor} mutedColor={mutedColor} />
              </View>

              {/* bio */}
              {user.bio ? (
                <View style={[s.card, { backgroundColor: cardBg, borderColor }]}>
                  <Text style={[s.sectionLabel, { color: mutedColor }]} numberOfLines={1}>About</Text>
                  <Text style={[s.bioText, { color: textColor }]} numberOfLines={12}>{user.bio}</Text>
                </View>
              ) : null}

              {/* Links & Contact section — Link-in-bio style */}
              <View style={s.linksSectionWrap}>
                <Text style={[s.sectionLabel, s.linksSectionTitle, { color: primaryColor }]} numberOfLines={1}>CONNECT &amp; LINKS</Text>
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

              {/* email — swipe-to-reveal: hides from bots/scrapers, real users swipe right */}
              {user.email ? (
                <SwipeToReveal
                  maskedValue={maskEmail(user.email)}
                  realValue={user.email}
                  icon="mail-outline"
                  iconColor={CP.teal}
                  iconBg={CP.teal + '18'}
                  isLoggedIn={!!currentUserId}
                  onRevealAction={() => openExternalUrl(`mailto:${user.email}`)}
                  textColor={textColor}
                  mutedColor={mutedColor}
                  cardBg={cardBg}
                  borderColor={borderColor}
                  primaryColor={primaryColor}
                />
              ) : null}

              {/* phone — swipe-to-reveal */}
              {user.phone ? (
                <SwipeToReveal
                  maskedValue={maskPhone(user.phone)}
                  realValue={user.phone}
                  icon="call-outline"
                  iconColor={primaryColor}
                  iconBg={primaryColor + '18'}
                  isLoggedIn={!!currentUserId}
                  onRevealAction={() => openExternalUrl(`tel:${user.phone}`)}
                  textColor={textColor}
                  mutedColor={mutedColor}
                  cardBg={cardBg}
                  borderColor={borderColor}
                  primaryColor={primaryColor}
                />
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
                    <Text style={[s.linkLabel, { color: textColor }]} numberOfLines={1}>{def.label}</Text>
                    <Ionicons name="arrow-forward" size={15} color={mutedColor} />
                  </Pressable>
                );
              })}

              {/* culture tags */}
              {tags.length > 0 ? (
                <View style={[s.card, { backgroundColor: cardBg, borderColor }]}>
                  <Text style={[s.sectionLabel, { color: mutedColor }]} numberOfLines={1}>Culture signals</Text>
                  <View style={s.tagsWrap}>
                    {tags.map((tag) => (
                      <View key={tag} style={[s.tag, { backgroundColor: primaryColor + '10', borderColor: primaryColor + '25' }]}>
                        <Text style={[s.tagText, { color: primaryColor }]} numberOfLines={1}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* ── Unified CulturePass Member ID Card ─────────────────────────── */}
              <View style={[s.unifiedMemberCard, { borderColor: primaryColor + '20' }]}>
                <View style={s.bizPassCard}>
                  <LinearGradient colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.02)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
                  <View style={s.bizPassInner}>
                    <View style={s.bizPassHeaderRow}>
                      <Text style={s.bizPassBrandTitle} numberOfLines={1}>
                        <Text style={s.bizPassBrandCulture} numberOfLines={1}>CULTURE</Text>
                        <Text style={s.bizPassBrandPass} numberOfLines={1}>PASS</Text>
                        <Text style={s.bizPassBrandId} numberOfLines={1}> ID</Text>
                      </Text>
                      <Text style={s.bizPassTierBadge} numberOfLines={1}>
                        {tierConf.label.toUpperCase()}
                      </Text>
                    </View>

                    <View style={s.bizPassBodyRow}>
                      <View style={s.bizPassLeftCol}>
                        <View style={s.bizPassAvatarCol}>
                          <View style={s.bizPassAvatarWrap}>
                            {du?.avatarUrl ? (
                              <Image source={{ uri: du.avatarUrl }} style={s.bizPassAvatar} contentFit="cover" transition={200} cachePolicy="memory-disk" />
                            ) : (
                              <View style={[s.bizPassAvatarFallback, { backgroundColor: UP.surfaceSubtle }]}>
                                <Text style={[s.bizPassAvatarInitials, { color: UP.ink }]} numberOfLines={1}>{ini}</Text>
                              </View>
                            )}
                          </View>
                          {du.affiliation && (
                            <View style={s.affiliationBadge}>
                              {du.affiliation.avatarUrl ? (
                                <Image source={{ uri: du.affiliation.avatarUrl }} style={s.affiliationBadgeImage} contentFit="cover" />
                              ) : (
                                <Ionicons name="business-outline" size={10} color={UP.inkTertiary} />
                              )}
                            </View>
                          )}
                        </View>

                        <View style={s.bizPassInfoCol}>
                          <View style={s.bizPassNameRow}>
                            <Text style={s.bizPassName} numberOfLines={1}>{displayName}</Text>
                            {du.isVerified && <Ionicons name="checkmark-circle" size={12} color={UP.brandId} />}
                          </View>
                          <Text style={s.bizPassHandle} numberOfLines={1}>@{du.handle ?? du.username}</Text>
                          {du.affiliation && (
                            <Text style={s.bizPassAffiliation} numberOfLines={1}>
                              🏢 {du.affiliation.name}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View style={s.bizPassQrCol}>
                        <View style={s.bizPassQrWrap}>
                          <QRCode
                            value={nicePublicUrl || profileUrl}
                            size={84}
                            color={UP.qrForeground}
                            backgroundColor={UP.qrBackground}
                            ecl="H"
                            logo={require('@/assets/images/culturepass-logo.png')}
                            logoSize={84 * 0.22}
                            logoBorderRadius={4}
                            logoBackgroundColor={UP.qrBackground}
                            logoMargin={2}
                          />
                        </View>
                        <Pressable onPress={handleCopy} style={s.cpidTapRow} hitSlop={8}>
                          <Ionicons name="wifi" size={12} color={UP.inkSecondary} style={s.cpidWifiIcon} />
                          <Text style={s.cpidTapText} numberOfLines={1}>
                            {cpid.slice(0, 3)}-{cpid.slice(3)}
                          </Text>
                          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={11} color={copied ? UP.copySuccess : UP.inkMuted} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Action buttons under the card */}
                <View style={s.unifiedCardActions}>
                  <Pressable
                    style={({ pressed }) => [s.unifiedCardBtn, { borderColor: borderColor, opacity: pressed ? 0.8 : 1 }]}
                    onPress={handleShare}
                  >
                    <Ionicons name="share-outline" size={14} color={textColor} />
                    <Text style={[s.unifiedCardBtnText, { color: textColor }]} numberOfLines={1}>Share Profile</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [s.unifiedCardBtn, { borderColor: borderColor, opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        navigator.clipboard?.writeText(nicePublicUrl || profileUrl).catch(() => { });
                        Alert.alert('Copied', 'Profile link copied!');
                      }
                    }}
                  >
                    <Ionicons name="copy-outline" size={14} color={textColor} />
                    <Text style={[s.unifiedCardBtnText, { color: textColor }]} numberOfLines={1}>Copy Link</Text>
                  </Pressable>
                </View>

                {isOwner && (
                  <Pressable
                    style={({ pressed }) => [s.unifiedCardFullBtn, { borderColor: CultureTokens.violet + '40', backgroundColor: CultureTokens.violet + '08', opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => router.push('/profile/digital-id')}
                  >
                    <Ionicons name="qr-code-outline" size={14} color={CultureTokens.violet} />
                    <Text style={[s.unifiedCardFullBtnText, { color: CultureTokens.violet }]} numberOfLines={1}>Save / Download Passes</Text>
                  </Pressable>
                )}
              </View>

              {/* ── Rich Contact Action Sheet (Message + Call with apps on the device) ── */}
              <Modal
                visible={!!contactSheet}
                transparent
                animationType="slide"
                onRequestClose={() => setContactSheet(null)}
              >
                <Pressable
                  style={s.contactSheetBackdrop}
                  onPress={() => setContactSheet(null)}
                />
                <View style={[s.contactSheetPanel, { backgroundColor: colors.surfaceElevated || UP.onFill, paddingBottom: safeInsets.bottom + 24 }]}>
                  <Text style={[s.contactSheetTitle, { color: colors.text, borderColor: colors.borderLight }]} numberOfLines={1}>
                    {contactSheet === 'message' ? 'Choose messaging method' : 'Choose calling method'}
                  </Text>

                  {/* Dynamic options */}
                  {contactSheet === 'message' && (
                    <>
                      {currentUserId && (
                        <Pressable onPress={() => { setContactSheet(null); router.push('/network' as never); }} style={s.contactOption}>
                          <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.text} />
                          <Text style={s.contactOptionText} numberOfLines={1}>Message on CulturePass</Text>
                        </Pressable>
                      )}
                      {phoneNumber && (
                        <Pressable onPress={() => openExternal(`sms:${phoneNumber}`)} style={s.contactOption}>
                          <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
                          <Text style={s.contactOptionText} numberOfLines={1}>{Platform.OS === 'ios' ? 'iMessage / SMS' : 'Text Message'}</Text>
                        </Pressable>
                      )}
                      {phoneNumber && (
                        <Pressable onPress={() => openExternal(`https://wa.me/${phoneNumber.replace(/\D/g, '')}`)} style={s.contactOption}>
                          <Ionicons name="logo-whatsapp" size={22} color={UP.whatsapp} />
                          <Text style={s.contactOptionText} numberOfLines={1}>WhatsApp</Text>
                        </Pressable>
                      )}
                      {emailAddress && (
                        <Pressable onPress={() => openExternal(`mailto:${emailAddress}`)} style={s.contactOption}>
                          <Ionicons name="mail-outline" size={22} color={colors.text} />
                          <Text style={s.contactOptionText} numberOfLines={1}>Email</Text>
                        </Pressable>
                      )}
                    </>
                  )}

                  {contactSheet === 'call' && (
                    <>
                      {phoneNumber && (
                        <Pressable onPress={() => openExternal(`tel:${phoneNumber}`)} style={s.contactOption}>
                          <Ionicons name="call-outline" size={22} color={colors.text} />
                          <Text style={s.contactOptionText} numberOfLines={1}>Phone Call</Text>
                        </Pressable>
                      )}
                      {phoneNumber && (
                        <Pressable onPress={() => openExternal(`https://wa.me/${phoneNumber.replace(/\D/g, '')}?call`)} style={s.contactOption}>
                          <Ionicons name="logo-whatsapp" size={22} color={UP.whatsapp} />
                          <Text style={s.contactOptionText} numberOfLines={1}>WhatsApp Call</Text>
                        </Pressable>
                      )}
                      {phoneNumber && Platform.OS === 'ios' && (
                        <Pressable onPress={() => openExternal(`facetime:${phoneNumber}`)} style={s.contactOption}>
                          <Ionicons name="videocam-outline" size={22} color={UP.facetime} />
                          <Text style={s.contactOptionText} numberOfLines={1}>FaceTime</Text>
                        </Pressable>
                      )}
                    </>
                  )}

                  <Pressable onPress={() => setContactSheet(null)} style={[s.contactOption, s.contactSheetCancel]}>
                    <Text style={[s.contactSheetCancelText, { color: colors.textSecondary }]} numberOfLines={1}>Cancel</Text>
                  </Pressable>
                </View>
              </Modal>

              {/* Associated profiles */}
              {userProfiles.length > 0 && (
                <View style={[s.sectionCard, { backgroundColor: cardBg, borderColor }]}>
                  <Text style={[s.sectionLabel, { color: mutedColor }]} numberOfLines={1}>Associated Profiles</Text>
                  <View style={s.listGap10}>
                    {userProfiles.map((profile: Profile) => (
                      <Pressable
                        key={profile.id}
                        onPress={() => router.push(`/profile/${profile.id}` as any)}
                        style={({ pressed }) => [
                          s.associatedProfileRow,
                          pressed && { opacity: 0.8 }
                        ]}
                      >
                        {profile.avatarUrl ? (
                          <Image source={{ uri: profile.avatarUrl }} style={s.associatedProfileAvatar} contentFit="cover" />
                        ) : (
                          <View style={[s.associatedProfileAvatarFallback, { backgroundColor: primaryColor + '15' }]}>
                            <Text style={[s.associatedProfileInitials, { color: primaryColor }]} numberOfLines={1}>
                              {(profile.name || 'P').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={s.flex1Gap2}>
                          <Text style={[s.associatedProfileName, { color: textColor }]} numberOfLines={1}>
                            {profile.name}
                          </Text>
                          <Text style={[s.associatedProfileType, { color: mutedColor }]} numberOfLines={1}>
                            {profile.entityType ? capitalize(profile.entityType) : 'Profile'}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color={mutedColor} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Hosted events */}
              {userEvents.length > 0 && (
                <View style={[s.sectionCard, { backgroundColor: cardBg, borderColor }]}>
                  <Text style={[s.sectionLabel, { color: mutedColor }]} numberOfLines={1}>Hosted Events</Text>
                  <View style={s.listGap12}>
                    {userEvents.map((ev: EventData) => (
                      <Pressable
                        key={ev.id}
                        onPress={() => router.push(`/event/${ev.id}` as any)}
                        style={({ pressed }) => [
                          s.eventRow,
                          pressed && { opacity: 0.8 }
                        ]}
                      >
                        {ev.imageUrl ? (
                          <Image source={{ uri: ev.imageUrl }} style={s.eventThumbnail} contentFit="cover" />
                        ) : (
                          <View style={[s.eventThumbnailFallback, { backgroundColor: primaryColor + '10' }]}>
                            <Ionicons name="calendar-outline" size={18} color={primaryColor} />
                          </View>
                        )}
                        <View style={s.flex1Gap2}>
                          <Text style={[s.eventName, { color: textColor }]} numberOfLines={1}>
                            {ev.title}
                          </Text>
                          <Text style={[s.eventMeta, { color: mutedColor }]} numberOfLines={1}>
                            {ev.date} • {ev.city}
                          </Text>
                          <Text style={[s.eventPrice, { color: primaryColor }]} numberOfLines={1}>
                            {ev.priceCents && ev.priceCents > 0 ? `$${(ev.priceCents / 100).toFixed(2)}` : 'Free'}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color={mutedColor} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

            </View>
          </View>{/* end page card */}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

// ─── contact info masking helpers ─────────────────────────────────────────────
/** Mask email: j***@***.com */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  const maskedLocal = local.length > 1 ? local[0] + '***' : '***';
  const parts = domain.split('.');
  const maskedDomain = parts.length >= 2
    ? '***.' + parts[parts.length - 1]
    : '***';
  return `${maskedLocal}@${maskedDomain}`;
}

/** Mask phone: keep country code prefix, hide rest */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  const visible = phone.startsWith('+') ? phone.slice(0, phone.indexOf(' ') + 1 || 3) : '';
  return visible + '*** *** ***';
}

// ─── SwipeToReveal component ───────────────────────────────────────────────────
/**
 * Wraps sensitive contact info (email / phone).
 * Shows masked value + lock icon by default.
 * Authenticated users can swipe right (or tap the lock) to reveal the real value.
 * Bots and unauthenticated scrapers never see the real data.
 */
interface SwipeToRevealProps {
  maskedValue: string;
  realValue: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  isLoggedIn: boolean;
  onRevealAction: () => void; // called when revealed & tapped (e.g. mailto:)
  textColor: string;
  mutedColor: string;
  cardBg: string;
  borderColor: string;
  primaryColor: string;
}

function SwipeToReveal({
  maskedValue,
  realValue,
  icon,
  iconColor,
  iconBg,
  isLoggedIn,
  onRevealAction,
  textColor,
  mutedColor,
  cardBg,
  borderColor,
  primaryColor,
}: SwipeToRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const REVEAL_THRESHOLD = 60; // px to swipe right to reveal

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gs) =>
        !revealed && isLoggedIn && Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_evt, gs) => {
        if (!revealed && isLoggedIn && gs.dx > 0) {
          translateX.setValue(Math.min(gs.dx, REVEAL_THRESHOLD + 20));
        }
      },
      onPanResponderRelease: (_evt, gs) => {
        if (!revealed && isLoggedIn && gs.dx >= REVEAL_THRESHOLD) {
          // Snap to revealed
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: Platform.OS !== 'web',
            tension: 120,
            friction: 8,
          }).start(() => setRevealed(true));
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: Platform.OS !== 'web',
            tension: 120,
            friction: 8,
          }).start();
        }
      },
    }),
  ).current;

  const handleTapLock = () => {
    if (!isLoggedIn) return; // silently ignore for bots/unauthenticated
    setRevealed(true);
  };

  const handleTapRevealed = () => {
    if (revealed) onRevealAction();
  };

  // Progress indicator: light green tint as user swipes
  const revealBg = translateX.interpolate({
    inputRange: [0, REVEAL_THRESHOLD],
    outputRange: [cardBg, primaryColor + '14'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        swipeStyles.pill,
        { backgroundColor: revealed ? cardBg : revealBg, borderColor },
      ]}
      {...(!revealed ? panResponder.panHandlers : {})}
    >
      {/* Swipe hint track (only when locked) */}
      {!revealed && isLoggedIn && (
        <Animated.View
          style={[
            swipeStyles.swipeTrack,
            {
              backgroundColor: primaryColor + '20',
              width: translateX,
            },
          ]}
          pointerEvents="none"
        />
      )}

      <View style={[swipeStyles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>

      <Pressable style={swipeStyles.textArea} onPress={handleTapRevealed}>
        {revealed ? (
          <Text style={[swipeStyles.label, { color: textColor }]} numberOfLines={1}>
            {realValue}
          </Text>
        ) : (
          <View style={swipeStyles.maskedRow}>
            <Text style={[swipeStyles.maskedText, { color: mutedColor }]} numberOfLines={1}>
              {maskedValue}
            </Text>
            {isLoggedIn && (
              <View style={[swipeStyles.swipeHint, { backgroundColor: primaryColor + '12' }]}>
                <Ionicons name="chevron-forward" size={10} color={primaryColor} />
                <Text style={[swipeStyles.swipeHintText, { color: primaryColor }]} numberOfLines={1}>swipe</Text>
              </View>
            )}
          </View>
        )}
      </Pressable>

      {/* Right side: lock (locked) or arrow (revealed) */}
      {revealed ? (
        <Pressable onPress={handleTapRevealed} hitSlop={8}>
          <Ionicons name="arrow-forward" size={15} color={mutedColor} />
        </Pressable>
      ) : (
        <Pressable onPress={handleTapLock} hitSlop={12}>
          <View style={[swipeStyles.lockBtn, { backgroundColor: isLoggedIn ? primaryColor + '12' : mutedColor + '18' }]}>
            <Ionicons
              name={isLoggedIn ? 'lock-closed' : 'lock-closed'}
              size={14}
              color={isLoggedIn ? primaryColor : mutedColor}
            />
          </View>
        </Pressable>
      )}
    </Animated.View>
  );
}

function StatItem({ label, value, textColor, mutedColor }: { label: string; value: number; textColor: string; mutedColor: string }) {
  return (
    <View style={statItemStyles.statItem}>
      <Text style={[statItemStyles.statNum, { color: textColor }]} numberOfLines={1}>{fmt(value)}</Text>
      <Text style={[statItemStyles.statLabel, { color: mutedColor }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export default function UserProfilePage() {
  return <UserPublicScreen />;
}




