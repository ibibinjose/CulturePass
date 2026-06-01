import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import Head from 'expo-router/head';
import { useQuery } from '@tanstack/react-query';

import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import { createLazyComponent } from '@/lib/lazy';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

// Creator Trust: Post-publish success with banner + activation CTAs
import { VerificationStatusBanner } from '@/modules/host/components/VerificationStatusBanner';
import { trackPostPublishActivation } from '@/modules/host/services/formAnalyticsService';
import { Button } from '@/design-system/ui/Button';
import { CultureTokens, Spacing, Radius } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { withAlpha } from '@/lib/withAlpha';
import { EntityTypeSelector, type EntityType } from '@/modules/host/components/EntityTypeSelector';
import { WizardContainer } from '@/modules/host/components/FormWizard/WizardContainer';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';
import { useAuth } from '@/lib/auth';
import { modulesApi } from '@/modules/api';

const HostspaceCreateWorkspace = createLazyComponent(
  () => import('@/modules/host/components/HostspaceCreateWorkspace')
);

// =============================================================================
// PHASE 1 UNIFICATION + CREATOR TRUST
// =============================================================================
// Rich persistent entity profiles (the livelihood-critical ones) MUST use the
// full FormWizard. This is the canonical, single source of truth for:
// - Draft recovery & auto-save
// - Legal/compliance gates (Step 3)
// - Verification transparency & status banners
// - Versioning, accessibility, AI assist, progressive disclosure
//
// The HostspaceCreateWorkspace is intentionally being evolved into a
// "Creation Lab launcher" for quick content (events, offers, listings, activities)
// under existing parent profiles. It must never host rich profile creation again.
//
// All entry points (EntityTypeSelector, quick actions, deep links, draft recovery)
// must route rich types here with ?profileType= so the wizard is unambiguous.
const RICH_PROFILE_TYPES: EntityType[] = ['business', 'venue', 'artist', 'professional', 'organiser', 'community'];

function isRichProfileType(type: string | undefined): type is EntityType {
  return !!type && RICH_PROFILE_TYPES.includes(type as EntityType);
}

const HOSTSPACE_CREATE_HEAD_TITLE = `HostSpace Creation Lab · ${APP_NAME}`;
const HOSTSPACE_CREATE_HEAD_DESC =
  'Create events, communities, and listings in the CulturePass host workspace.';
const HOSTSPACE_CREATE_HEAD_URL = `${SITE_ORIGIN}/hostspace/create`;

export default function HostspaceCreateIndex() {
  const params = useLocalSearchParams<{ 
    category?: string | string[]; 
    intent?: string;
    profileType?: string | string[];   // New: for rich profile wizard flow
    draftId?: string | string[];
    profileId?: string | string[];     // For editing existing profiles
  }>();
  
  const { intent } = params;

  // Support both legacy ?category= and new ?profileType= for rich profiles
  const profileTypeRaw = Array.isArray(params.profileType) ? params.profileType[0] : params.profileType;
  const categoryRaw = Array.isArray(params.category) ? params.category[0] : params.category;
  
  // Nation Builder intent: default to rich business profile for the full wizard
  const isNationBuilder = typeof intent === 'string' && intent === 'nation-builder';
  const effectiveProfileType = profileTypeRaw || (isNationBuilder ? 'business' : undefined);
  const effectiveCategory = categoryRaw || (isNationBuilder ? undefined : categoryRaw);
  
  const raw = effectiveProfileType || effectiveCategory;
  const isProfileWizard = !!effectiveProfileType;

  const draftId = Array.isArray(params.draftId) ? params.draftId[0] : params.draftId;
  const editProfileId = Array.isArray(params.profileId) ? params.profileId[0] : params.profileId;
  const { user } = useAuth();
  const [showEntitySelector, setShowEntitySelector] = useState(!raw);

  // Creator Trust: Post-publish success state for rich profiles
  const [publishedProfile, setPublishedProfile] = useState<{ id: string; entityType: EntityType } | null>(null);
  const colors = useColors();

  // Fetch existing profiles to show which entity types are already created
  const { data: myProfiles = [] } = useQuery({
    queryKey: ['hostspace-my-profiles'],
    queryFn: () => modulesApi.profiles.my(),
    enabled: !!user,
    staleTime: 30_000,
  });

  const handleEntityTypeSelect = (entityType: EntityType) => {
    // Creator Trust + Phase 1 Unification enforcement
    if (isRichProfileType(entityType)) {
      // All rich profiles go through the full 6-step wizard (legal gates, recovery, verification transparency)
      router.push(`/hostspace/create?profileType=${entityType}` as never);
    } else {
      // Quick content creation stays in the workspace launcher (events, offers, marketplace, activities)
      router.push(`/hostspace/create?category=${entityType}` as never);
    }
    setShowEntitySelector(false);
  };

  return (
    <>
      <Head>
        <title>{HOSTSPACE_CREATE_HEAD_TITLE}</title>
        <meta name="description" content={HOSTSPACE_CREATE_HEAD_DESC} />
        <meta property="og:title" content={HOSTSPACE_CREATE_HEAD_TITLE} />
        <meta property="og:description" content={HOSTSPACE_CREATE_HEAD_DESC} />
        <meta property="og:url" content={HOSTSPACE_CREATE_HEAD_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={HOSTSPACE_CREATE_HEAD_URL} />
      </Head>
      <ErrorBoundary
        onError={(error, stackTrace) => {
          console.error('Hostspace create route failed', error, stackTrace);
        }}
      >
        <HostspaceAccessGate intent="creationLab">
          {/* Creator Trust: Dedicated post-publish success experience for rich profiles (highest emotional payoff + activation moment) */}
          {publishedProfile ? (
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: Spacing.xl, backgroundColor: colors.background }}>
              <LinearGradient
                colors={[withAlpha(CultureTokens.success, 0.12), 'transparent']}
                style={[StyleSheet.absoluteFill, { height: 400 }]}
              />
              <View style={{ alignItems: 'center', marginBottom: Spacing.xl, paddingTop: Spacing.xl * 2 }}>
                <View style={{ backgroundColor: CultureTokens.success + '15', padding: 20, borderRadius: 999, marginBottom: Spacing.lg }}>
                  <Ionicons name="sparkles" size={48} color={CultureTokens.success} />
                </View>
                <Text style={{ fontSize: 32, fontFamily: 'Poppins_700Bold', color: colors.text, textAlign: 'center', letterSpacing: -0.5 }}>
                  It&apos;s official.
                </Text>
                <Text style={{ fontSize: 18, color: colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center', maxWidth: 420 }}>
                  Your cultural profile is live and ready to connect with the diaspora.
                </Text>
              </View>

              <VerificationStatusBanner
                status="not_started"
                entityType={publishedProfile.entityType as any}
                unlocksToday={getPostPublishUnlocksToday(publishedProfile.entityType)}
                unlocksAfter={getPostPublishUnlocksAfter(publishedProfile.entityType)}
                onAction={() => {
                  const ctx = buildPublishContext(publishedProfile, user);
                  trackPostPublishActivation(ctx, 'request_verification');
                  setPublishedProfile(null);
                  router.replace(`/hostspace` as any);
                }}
                location="post_publish"
              />

              <View style={{ marginTop: Spacing.xl, gap: Spacing.sm }}>
                <Button
                  variant="primary"
                  onPress={() => {
                    const ctx = buildPublishContext(publishedProfile, user);
                    trackPostPublishActivation(ctx, 'create_event');
                    setPublishedProfile(null);
                    router.push({ pathname: '/event/create', params: { publisherProfileId: publishedProfile.id } } as never);
                  }}
                >
                  Create your first event under this profile
                </Button>
                <Button
                  variant="outline"
                  onPress={() => {
                    const ctx = buildPublishContext(publishedProfile, user);
                    trackPostPublishActivation(ctx, 'view_dashboard');
                    setPublishedProfile(null);
                    router.replace(`/hostspace` as any);
                  }}
                >
                  Go to HostSpace Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onPress={() => {
                    const ctx = buildPublishContext(publishedProfile, user);
                    trackPostPublishActivation(ctx, 'share_profile');
                    setPublishedProfile(null);
                    router.replace(`/profile/${publishedProfile.id}` as any);
                  }}
                >
                  View & share your new profile
                </Button>
              </View>

              <Text style={{ textAlign: 'center', color: colors.textTertiary, marginTop: Spacing.xl, fontSize: 12 }}>
                You can always edit or add verification documents from your HostSpace.
              </Text>
            </ScrollView>
          ) : showEntitySelector ? (
            <EntityTypeSelector
              onSelect={handleEntityTypeSelect}
              existingProfiles={myProfiles}
              intent={typeof intent === 'string' ? intent : undefined}
            />
          ) : isRichProfileType(raw) ? (
            // Phase 1 Unification: Rich profiles now use the full FormWizard
            <WizardContainer
              entityType={raw}
              draftId={draftId}
              profileId={editProfileId}
              onPublishSuccess={(profileId) => {
                // Creator Trust: Deliver rich post-publish success with verification banner + activation CTAs
                if (isRichProfileType(raw)) {
                  setPublishedProfile({ id: profileId, entityType: raw as any });
                } else {
                  router.replace(`/hostspace` as any);
                }
              }}
              onCancel={() => {
                // Better back behavior: go back to selector if we came from it
                if (isProfileWizard) {
                  router.replace('/hostspace/create' as any);
                } else {
                  router.back();
                }
              }}
            />
          ) : (
            <HostspaceCreateWorkspace initialCategory={raw} />
          )}
        </HostspaceAccessGate>
      </ErrorBoundary>
    </>
  );
}

// =============================================================================
// Creator Trust Helpers for Post-Publish Success
// =============================================================================

function getPostPublishUnlocksToday(entityType: EntityType): string[] {
  const base = ['Directory listing', 'Free events & activities'];
  if (entityType === 'business' || entityType === 'venue') {
    return [...base, 'Build customer trust with verified badge'];
  }
  if ((entityType as string) === 'organiser' || (entityType as string) === 'organizer') {
    return [...base, 'Publish community events immediately'];
  }
  return base;
}

function getPostPublishUnlocksAfter(entityType: EntityType): string[] {
  if (entityType === 'business' || entityType === 'venue') {
    return ['Paid ticketing & sales', 'CultureMarket listings', 'Featured search placement'];
  }
  if ((entityType as string) === 'organiser' || (entityType as string) === 'organizer') {
    return ['Paid ticketed events', 'Full analytics & revenue tools', 'Priority large-event support'];
  }
  if (entityType === 'artist' || entityType === 'professional') {
    return ['Paid bookings & collaborations', 'Creator directory featuring', 'Direct inquiry inbox'];
  }
  return ['Paid membership tiers', 'Event ticketing', 'Advanced community features'];
}

function buildPublishContext(profile: { id: string; entityType: EntityType }, user: any): any {
  // Minimal valid context for the trust analytics service (expanded in real usage with sessionId etc.)
  return {
    sessionId: `postpub-${Date.now()}`,
    userId: user?.id ?? 'anonymous',
    entityType: profile.entityType,
    device: { platform: 'web' as const },
    profileId: profile.id,
  };
}
