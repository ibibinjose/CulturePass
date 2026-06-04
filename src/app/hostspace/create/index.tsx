import React, { useState, Suspense, useCallback } from 'react';

import { useLocalSearchParams, router } from 'expo-router';
import Head from 'expo-router/head';
import { useQuery } from '@tanstack/react-query';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import { VerificationStatusBanner } from '@/modules/host/components/VerificationStatusBanner';
import { trackPostPublishActivation } from '@/modules/host/services/formAnalyticsService';
import { LuxeText, LuxeButton, GlassView } from '@/design-system/ui';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { Spacing } from '@/design-system/tokens/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import { withAlpha } from '@/lib/withAlpha';
import { EntityTypeSelector, type EntityType } from '@/modules/host/components/EntityTypeSelector';
import { WizardContainer } from '@/modules/host/components/FormWizard/WizardContainer';
import { HostspaceCreateWorkspace } from '@/modules/host/components/HostspaceCreateWorkspace';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';
import { useAuth } from '@/lib/auth';
import { modulesApi } from '@/modules/api';

function WizardLoading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <ActivityIndicator size="large" color={Luxe.colors.indigo} />
      <LuxeText variant="caption" style={{ marginTop: 16, color: '#666' }}>Initializing creation studio…</LuxeText>
    </View>
  );
}

const RICH_PROFILE_TYPES: string[] = ['business', 'venue', 'artist', 'professional', 'organiser', 'community', 'organizer'];

function isRichProfileType(type: string | undefined): boolean {
  return !!type && RICH_PROFILE_TYPES.includes(type);
}

const HOSTSPACE_CREATE_HEAD_TITLE = `HostSpace Creation Lab · ${APP_NAME}`;
const HOSTSPACE_CREATE_HEAD_DESC =
  'Create events, communities, and listings in the CulturePass host workspace.';
const HOSTSPACE_CREATE_HEAD_URL = `${SITE_ORIGIN}/hostspace/create`;

export default function HostspaceCreateIndex() {
  const params = useLocalSearchParams<{ 
    category?: string | string[]; 
    intent?: string;
    profileType?: string | string[];
    draftId?: string | string[];
    profileId?: string | string[];
  }>();
  
  const { intent } = params;
  const profileTypeRaw = Array.isArray(params.profileType) ? params.profileType[0] : params.profileType;
  const categoryRaw = Array.isArray(params.category) ? params.category[0] : params.category;
  
  const isNationBuilder = typeof intent === 'string' && intent === 'nation-builder';
  const effectiveProfileType = profileTypeRaw || (isNationBuilder ? 'business' : undefined);
  const effectiveCategory = categoryRaw || (isNationBuilder ? undefined : categoryRaw);
  
  const raw = effectiveProfileType || effectiveCategory;
  const isProfileWizard = !!effectiveProfileType;

  const draftId = Array.isArray(params.draftId) ? params.draftId[0] : params.draftId;
  const editProfileId = Array.isArray(params.profileId) ? params.profileId[0] : params.profileId;
  const { user } = useAuth();
  const [showEntitySelector, setShowEntitySelector] = useState(!raw);

  const [publishedProfile, setPublishedProfile] = useState<{ id: string; entityType: string } | null>(null);
  const colors = useColors();
  const isDark = useIsDark();

  const { data: myProfiles = [] } = useQuery({
    queryKey: ['hostspace-my-profiles'],
    queryFn: () => modulesApi.profiles.my(),
    enabled: !!user,
    staleTime: 30_000,
  });

  const handleEntityTypeSelect = useCallback((entityType: EntityType) => {
    if (isRichProfileType(entityType)) {
      router.push(`/hostspace/create?profileType=${entityType}` as never);
    } else {
      router.push(`/hostspace/create?category=${entityType}` as never);
    }
    setShowEntitySelector(false);
  }, []);

  const onPublishSuccess = useCallback((profileId: string) => {
    if (isRichProfileType(raw)) {
      setPublishedProfile({ id: profileId, entityType: raw as string });
    } else {
      router.replace(`/hostspace` as any);
    }
  }, [raw]);

  const onCancel = useCallback(() => {
    if (isProfileWizard) {
      router.replace('/hostspace/create' as any);
    } else {
      router.back();
    }
  }, [isProfileWizard]);

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
      <ErrorBoundary>
        <HostspaceAccessGate intent="creationLab">
          {publishedProfile ? (
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 60, backgroundColor: colors.background }}>
              <LinearGradient
                colors={isDark ? ['#0F0B1A', '#000'] : ['#F5F1EE', '#FAF9F6']}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={[withAlpha(Luxe.colors.emerald, 0.1), 'transparent']}
                style={{ height: 450, position: 'absolute', top: 0, left: 0, right: 0 }}
              />

              <View style={{ alignItems: 'center', marginBottom: 40, paddingTop: 80, paddingHorizontal: 24 }}>
                <GlassView intensity={20} style={{ backgroundColor: Luxe.colors.emerald + '15', padding: 24, borderRadius: 32, marginBottom: 24 }}>
                  <Ionicons name="sparkles" size={48} color={Luxe.colors.emerald} />
                </GlassView>
                <LuxeText variant="display" style={{ color: colors.text, textAlign: 'center' }}>
                  It&apos;s official.
                </LuxeText>
                <LuxeText variant="body" style={{ color: colors.textSecondary, marginTop: 12, textAlign: 'center', maxWidth: 380 }}>
                  Your cultural profile is live and ready to connect with the diaspora.
                </LuxeText>
              </View>

              <View style={{ paddingHorizontal: 20 }}>
                <VerificationStatusBanner
                    status="not_started"
                    entityType={publishedProfile.entityType as any}
                    unlocksToday={getPostPublishUnlocksToday(publishedProfile.entityType as any)}
                    unlocksAfter={getPostPublishUnlocksAfter(publishedProfile.entityType as any)}
                    onAction={() => {
                    const ctx = buildPublishContext(publishedProfile, user);
                    trackPostPublishActivation(ctx, 'request_verification');
                    setPublishedProfile(null);
                    router.replace(`/hostspace` as any);
                    }}
                    location="post_publish"
                />

                <View style={{ marginTop: 32, gap: 12 }}>
                    <LuxeButton
                        variant="filled"
                        size="lg"
                        onPress={() => {
                            const ctx = buildPublishContext(publishedProfile, user);
                            trackPostPublishActivation(ctx, 'create_event');
                            setPublishedProfile(null);
                            router.push({ pathname: '/event/create', params: { publisherProfileId: publishedProfile.id } } as never);
                        }}
                        leftIcon="add-circle-outline"
                    >
                        Create your first event
                    </LuxeButton>
                    <LuxeButton
                        variant="tonal"
                        size="lg"
                        onPress={() => {
                            const ctx = buildPublishContext(publishedProfile, user);
                            trackPostPublishActivation(ctx, 'view_dashboard');
                            setPublishedProfile(null);
                            router.replace(`/hostspace` as any);
                        }}
                    >
                        Go to Dashboard
                    </LuxeButton>
                    <LuxeButton
                        variant="ghost"
                        size="lg"
                        onPress={() => {
                            const ctx = buildPublishContext(publishedProfile, user);
                            trackPostPublishActivation(ctx, 'share_profile');
                            setPublishedProfile(null);
                            router.replace(`/profile/${publishedProfile.id}` as any);
                        }}
                        leftIcon="share-social-outline"
                    >
                        View & share profile
                    </LuxeButton>
                </View>

                <LuxeText variant="caption" style={{ textAlign: 'center', color: colors.textTertiary, marginTop: 40 }}>
                    You can always edit or add verification documents from your HostSpace.
                </LuxeText>
              </View>
            </ScrollView>
          ) : showEntitySelector ? (
            <EntityTypeSelector
                onSelect={handleEntityTypeSelect}
                existingProfiles={myProfiles}
                intent={typeof intent === 'string' ? intent : undefined}
            />
          ) : isRichProfileType(raw) ? (
            <WizardContainer
                entityType={raw as any}
                draftId={draftId}
                profileId={editProfileId}
                onPublishSuccess={onPublishSuccess}
                onCancel={onCancel}
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

function getPostPublishUnlocksToday(entityType: string): string[] {
  const base = ['Directory listing', 'Free events & activities'];
  if (entityType === 'business' || entityType === 'venue') {
    return [...base, 'Build customer trust with verified badge'];
  }
  if (entityType === 'organiser' || entityType === 'organizer') {
    return [...base, 'Publish community events immediately'];
  }
  return base;
}

function getPostPublishUnlocksAfter(entityType: string): string[] {
  if (entityType === 'business' || entityType === 'venue') {
    return ['Paid ticketing & sales', 'CultureMarket listings', 'Featured search placement'];
  }
  if (entityType === 'organiser' || entityType === 'organizer') {
    return ['Paid ticketed events', 'Full analytics & revenue tools', 'Priority large-event support'];
  }
  if (entityType === 'artist' || entityType === 'professional') {
    return ['Paid bookings & collaborations', 'Creator directory featuring', 'Direct inquiry inbox'];
  }
  return ['Paid membership tiers', 'Event ticketing', 'Advanced community features'];
}

function buildPublishContext(profile: { id: string; entityType: string }, user: any): any {
  return {
    sessionId: `postpub-${Date.now()}`,
    userId: user?.id ?? 'anonymous',
    entityType: profile.entityType,
    device: { platform: 'web' as const },
    profileId: profile.id,
  };
}
