import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,

  Share,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { User, Membership } from '@shared/schema';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useColors } from '@/hooks/useColors';
import { gradients } from '@/design-system/tokens/theme';
import { modulesApi } from '@/modules/api';
import { useAuth } from '@/lib/auth';
import { formatLocationLabel } from '@/lib/format';
import { goBackOrReplace } from '@/lib/navigation';
import { canonicalUserPath, siteUrl } from '@/lib/publicPaths';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { profileShareDescription, profileShareTitle, profileShareUrl } from '@/lib/profileShare';

import { getStyles } from '@/modules/profile/components/public/styles';
import {
  CP,
  ACCENT_COLORS,
  SOCIAL_ICONS,
  TIER_CONFIG,
  formatMemberDate,
  getInitials,
} from '@/modules/profile/components/public/constants';

import { BrandDots } from '@/modules/profile/components/public/BrandDots';
import { StatItem } from '@/modules/profile/components/public/StatItem';
import { SectionHeader } from '@/modules/profile/components/public/SectionHeader';
import { SocialCard } from '@/modules/profile/components/public/SocialCard';
import { DetailRow } from '@/modules/profile/components/public/DetailRow';
import { LoadingSkeleton } from '@/modules/profile/components/public/LoadingSkeleton';
import { NameTaglineLockup } from '@/design-system/ui';

export default function PublicProfileScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset    = safeInsets.top;
  const bottomInset = safeInsets.bottom;

  const { userId: authUserId, isRestoring } = useAuth();

  const { data: user, isPending } = useQuery<User>({
    queryKey: ['/api/auth/me', 'profile-public', authUserId],
    queryFn: () => modulesApi.auth.me(),
    enabled: Boolean(authUserId) && !isRestoring,
  });
  const profileLoading = isRestoring || (Boolean(authUserId) && isPending && !user);
  const userId = user?.id;

  const { data: membership } = useQuery<Membership>({
    queryKey: [`/api/membership/${userId}`],
    enabled: !!userId,
  });

  const tier     = membership?.tier ?? 'free';
  const tierConf = TIER_CONFIG[tier] ?? TIER_CONFIG.free;

  const socialLinks   = useMemo(() => (user?.socialLinks ?? {}) as Record<string, string | undefined>, [user?.socialLinks]);
  const activeSocials = useMemo(() => SOCIAL_ICONS.filter(s => socialLinks[s.key]), [socialLinks]);

  const displayName  = user?.displayName ?? 'CulturePass User';
  const initials     = useMemo(() => getInitials(displayName), [displayName]);
  const locationText = useMemo(() => formatLocationLabel(user?.city, user?.country, ''), [user?.city, user?.country]);
  const memberSince  = useMemo(() => formatMemberDate(user?.createdAt), [user?.createdAt]);
  const hasDetails   = !!(locationText || user?.website || user?.phone);

  // Hoisted for the modern public profile card (QR + link row) and share sheet
  const shareUser = useMemo(() => ({
    id: userId || user?.id || '',
    displayName,
    username: user?.username,
    handle: user?.handle,
    handleStatus: user?.handleStatus,
    culturePassId: user?.culturePassId,
    bio: user?.bio,
    avatarUrl: user?.avatarUrl,
  }), [userId, user?.id, displayName, user?.username, user?.handle, user?.handleStatus, user?.culturePassId, user?.bio, user?.avatarUrl]);

  const handleShare = useCallback(async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const shareUrl = siteUrl(
        canonicalUserPath({
          id: userId || '',
          handle: user?.handle,
          handleStatus: user?.handleStatus,
          culturePassId: user?.culturePassId,
        }),
      );
      const shareUser = {
        id: userId || user?.id || '',
        displayName,
        username: user?.username,
        handle: user?.handle,
        handleStatus: user?.handleStatus,
        culturePassId: user?.culturePassId,
        bio: user?.bio,
        avatarUrl: user?.avatarUrl,
      };
      const shareTitle = profileShareTitle(shareUser);
      const shareDescription = profileShareDescription(shareUser);
      const shareMessage = `${shareDescription}\n\n${profileShareUrl(shareUser)}`;
      if (Platform.OS === 'web') {
        if (navigator.share) await navigator.share({ title: shareTitle, text: shareDescription, url: shareUrl });
        else await navigator.clipboard?.writeText(shareUrl);
      } else if (Platform.OS === 'ios') {
        await Share.share({ title: shareTitle, message: shareDescription, url: shareUrl });
      } else {
        await Share.share({ title: shareTitle, message: shareMessage });
      }
    } catch { /* noop */ }
  }, [displayName, userId, user?.id, user?.username, user?.bio, user?.avatarUrl, user?.culturePassId, user?.handle, user?.handleStatus]);

  const handleOpenSocial = useCallback((key: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = socialLinks[key];
    if (url) openExternalUrl(url);
  }, [socialLinks]);

  if (profileLoading) return <LoadingSkeleton topInset={topInset} />;

  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="person-outline" size={52} color={CP.muted} />
        <Text style={[styles.errorText, { marginTop: 14 }]}>Profile not found</Text>
        <Pressable style={styles.backButton} onPress={() => goBackOrReplace('/(tabs)')}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentContainerStyle={{ paddingBottom: bottomInset + 30 }}
        bounces={false}
      >
        <LinearGradient
          colors={gradients.midnight}
          style={[styles.hero, { paddingTop: topInset + 16 }]}
        >
          <View style={[styles.arcOuter, { pointerEvents: 'none' }]} />
          <View style={[styles.arcInner, { pointerEvents: 'none' }]} />

          <View style={[styles.heroRingsWm, { pointerEvents: 'none' }]}>
            <BrandDots size={60} opacity={0.03} />
          </View>

          <View style={styles.heroNav}>
            <Pressable
              style={styles.navBtn}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                goBackOrReplace('/(tabs)');
              }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              {...(Platform.OS === 'android'
                ? { android_ripple: { color: 'rgba(255,255,255,0.15)', borderless: true } }
                : {})}
            >
              <Ionicons name="chevron-back" size={22} color={colors.textInverse} />
            </Pressable>
            <Pressable
              style={styles.navBtn}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share profile"
              {...(Platform.OS === 'android'
                ? { android_ripple: { color: 'rgba(255,255,255,0.15)', borderless: true } }
                : {})}
            >
              <Ionicons name="share-outline" size={20} color={colors.textInverse} />
            </Pressable>
          </View>

          <View style={styles.heroCenter}>
            <View style={[styles.avatarGlow, { pointerEvents: 'none' }]} />
            <LinearGradient
              colors={[CP.teal, CP.purple]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.avatarGradientRing}
            >
              <View style={styles.avatarInner}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </LinearGradient>

            {user.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-sharp" size={14} color={CP.dark} />
              </View>
            )}

            <NameTaglineLockup
              name={displayName}
              nameColor={colors.text}
              size="md"
              align="center"
              marginBottom={2}
            />
            <Text style={styles.heroHandle}>+{user.handle ?? user.username}</Text>

            <View style={styles.heroPills}>
              {user.role === 'admin' && (
                <View style={styles.heroPill}>
                  <Ionicons name="people" size={12} color={CP.muted} />
                  <Text style={styles.heroPillText}>Admin</Text>
                </View>
              )}
              {user.isVerified && (
                <View style={[styles.heroPill, styles.heroPillAccent]}>
                  <Ionicons name="shield-checkmark" size={12} color={CP.teal} />
                  <Text style={[styles.heroPillText, { color: CP.teal }]}>Verified</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.statsBar}>
            <LinearGradient colors={[CP.teal + '00', CP.teal, CP.teal + '00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.statsAccentLine} />
            <StatItem value={user.connectionsCount ?? 0} label="Connections" />
            <View style={styles.statDivider} />
            <StatItem value={user.eventsAttended ?? 0} label="Events" />
            <View style={styles.statDivider} />
            <StatItem value={user.behavioral?.claimedPerks ?? 0} label="Points" />
          </View>
        </LinearGradient>

        <View style={styles.tierRow}>
          <LinearGradient
            colors={[tierConf.color + '1A', tierConf.color + '05']}
            style={[styles.tierBadge, { borderColor: tierConf.color + '40' }]}
          >
            <Ionicons name={tierConf.icon as keyof typeof Ionicons.glyphMap} size={16} color={tierConf.color} />
            <Text style={[styles.tierText, { color: tierConf.color }]}>{tierConf.label} Member</Text>
          </LinearGradient>

          {memberSince ? (
            <View style={styles.memberSince}>
              <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.memberSinceText}>Joined {memberSince}</Text>
            </View>
          ) : null}
        </View>

        {user.bio && (
          <View style={styles.section}>
            <SectionHeader title="About" />
            <View style={styles.card}>
              <Text style={styles.bioText}>{user.bio}</Text>
            </View>
          </View>
        )}

        {activeSocials.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Social" />
            <View style={styles.socialGrid}>
              {activeSocials.map((s, i) => (
                <SocialCard
                  key={s.key}
                  icon={s.icon as keyof typeof Ionicons.glyphMap}
                  label={s.label}
                  color={s.color}
                  accentColor={ACCENT_COLORS[i % ACCENT_COLORS.length]}
                  onPress={() => handleOpenSocial(s.key)}
                />
              ))}
            </View>
          </View>
        )}

        {hasDetails && (
          <View style={styles.section}>
            <SectionHeader title="Details" />
            <View style={styles.card}>
              {locationText ? (
                <DetailRow
                  icon="location-outline"
                  iconBg={CP.ember + '1A'}
                  iconColor={CP.ember}
                  label="Location"
                  value={locationText}
                />
              ) : null}

              {user.website ? (
                <>
                  {locationText && <View style={styles.detailDivider} />}
                  <DetailRow
                    icon="globe-outline"
                    iconBg={CP.info + '1A'}
                    iconColor={CP.info}
                    label="Website"
                    value={user.website.replace(/^https?:\/\//, '')}
                    valueColor={CP.info}
                    showArrow
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      openExternalUrl(user.website!);
                    }}
                  />
                </>
              ) : null}
            </View>
          </View>
        )}

        {user.culturePassId && (
          <View style={styles.section}>
            <SectionHeader title="Digital ID" />

            {/* CulturePass Member ID card — clean single-color premium treatment */}
            <View style={[styles.cpidCard, { backgroundColor: '#162B6B' }]}>
              <View style={styles.cpidAccentGold} />

              <View style={styles.cpidTop}>
                <View style={styles.cpidLogoRow}>
                  <View style={[styles.cpidLogoIcon, { backgroundColor: 'rgba(212,175,55,0.18)' }]}>
                    <Text style={{ fontFamily: 'Poppins_700Bold', color: '#D4AF37', fontSize: 13 }}>CP</Text>
                  </View>
                  <Text style={styles.cpidLogoText}>CulturePass</Text>
                </View>
                {user.isVerified && (
                  <View style={styles.cpidVerifiedIcon}>
                    <Ionicons name="shield-checkmark" size={16} color="#D4AF37" />
                  </View>
                )}
              </View>

              <View style={styles.cpidCenterSolid}>
                <Text style={styles.cpidLabelSolid}>CULTUREPASS ID</Text>
                <Text style={styles.cpidValueSolid}>{user.culturePassId.toUpperCase()}</Text>
              </View>

              <View style={styles.cpidMetaSolid}>
                <View style={styles.cpidMetaItem}>
                  <Text style={styles.cpidMetaLabelSolid}>Tier</Text>
                  <Text style={[styles.cpidMetaValueSolid, { color: '#D4AF37' }]}>{tierConf.label}</Text>
                </View>
                <View style={styles.cpidMetaItem}>
                  <Text style={styles.cpidMetaLabelSolid}>Member since</Text>
                  <Text style={styles.cpidMetaValueSolid}>{formatMemberDate(user.createdAt)}</Text>
                </View>
              </View>

              <View style={styles.cpidFooterSolid}>
                <Text style={styles.cpidFooterTextSolid}>{displayName}</Text>
                <Text style={styles.cpidFooterTextSolid}>@{user.handle ?? user.username}</Text>
              </View>
            </View>

            {/* ── Modern Branded Public Profile Card (with QR preview) ───────────── */}
            <View style={[styles.publicProfileCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <View style={styles.publicHeader}>
                <View style={[styles.entityPill, { backgroundColor: CP.teal + '15' }]}>
                  <Ionicons name="link-outline" size={13} color={CP.teal} />
                  <Text style={[styles.entityPillText, { color: CP.teal }]}>Public Profile</Text>
                </View>
              </View>

              <View style={styles.publicContent}>
                <View style={styles.qrBox}>
                  <QRCode
                    value={profileShareUrl(shareUser)}
                    size={72}
                    color={colors.text}
                    backgroundColor={colors.surface}
                  />
                </View>

                <View style={{ flex: 1, gap: 6 }}>
                  <Pressable
                    style={[styles.publicLinkRow, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={async () => {
                      const url = profileShareUrl(shareUser);
                      if (Platform.OS === 'web') {
                        await navigator.clipboard?.writeText(url).catch(() => {});
                      } else {
                        await Share.share({ message: url }).catch(() => {});
                      }
                    }}
                  >
                    <Text style={[styles.publicLink, { color: colors.text }]} numberOfLines={1}>
                      {profileShareUrl(shareUser).replace(/^https?:\/\//, '')}
                    </Text>
                    <Ionicons name="copy-outline" size={16} color={CP.teal} />
                  </Pressable>

                  <View style={styles.publicActions}>
                    <Pressable style={styles.publicAction} onPress={handleShare}>
                      <Ionicons name="share-outline" size={15} color={colors.textSecondary} />
                      <Text style={styles.publicActionText}>Share</Text>
                    </Pressable>
                    {authUserId === userId && (
                      <Pressable style={styles.publicAction} onPress={() => router.push('/profile/edit')}>
                        <Ionicons name="create-outline" size={15} color={colors.textSecondary} />
                        <Text style={styles.publicActionText}>Edit</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            </View>

            <Pressable
              style={styles.viewQrBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/profile/qr');
              }}
            >
              <LinearGradient colors={[CP.teal + '1A', CP.purple + '0D']} style={styles.viewQrIconWrap}>
                <Ionicons name="qr-code-outline" size={20} color={CP.teal} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.viewQrText}>View Full QR Code</Text>
                <Text style={styles.viewQrSub}>For printing or larger displays</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={CP.muted} />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
