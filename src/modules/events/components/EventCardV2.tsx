/**
 * EventCardV2 — canonical Mode-C event card.
 *
 * Token migrations vs V1:
 *  - Card radius via CardTokens.radius (20)
 *  - Age badge → <Badge shape="caps" />
 *  - Save bookmark → <SaveToggle />
 *  - Live badge gradient → gradients.coralPressed
 *  - Hex tokenized except: shadow '#000' (convention), '#FFFFFF' on coral gradient (visual constant),
 *    snackbar '#222'/'#fff' (always-dark snackbar — calls out below)
 *
 * Behaviorally equivalent to V1. Gated behind `eventcard-v2` feature flag.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CultureImage } from '@/design-system/ui/CultureImage';
import { Badge } from '@/design-system/ui/Badge';
import { SaveToggle } from '@/design-system/ui/SaveToggle';
import { LikeToggle } from '@/design-system/ui/LikeToggle';
import { EventPublisherLine } from '@/modules/events/components/list/EventPublisherLine';
import { EventPublisherLogo } from '@/modules/events/components/list/EventPublisherLogo';
import { CultureTagRow, mergeCultureTagFields } from '@/design-system/ui/CultureTag';
import { CultureFlagBadge } from '@/components/culture/CultureFlagBadge';
import { resolveEventCultureFlag } from '@/lib/cultureIdentity';
import { CardTokens, CultureTokens, TextStyles, gradients, Luxe, LuxeTextStyles } from '@/design-system/tokens/theme';
import { useSaved } from '@/contexts/SavedContext';
import { useLikes } from '@/contexts/LikesContext';
import { eventPaths } from '@/modules/events/services/navigation';
import { useColors } from '@/hooks/useColors';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import { formatEventDateTime } from '@/lib/dateUtils';
import type { EventData } from '@/shared/schema';

interface EventCardProps {
  event: EventData;
  isLive?: boolean;
  canEdit?: boolean;
  onEdit?: (event: EventData) => void;
  onDelete?: (event: EventData) => void;
}

function EventCardV2Inner({ event, isLive, canEdit, onEdit, onDelete }: EventCardProps) {
  const colors = useColors();
  const { isEventSaved, toggleSaveEvent } = useSaved();
  const { isLiked, toggleLike } = useLikes();
  const { exportEventToCalendar } = useCalendarSync();
  const isSaved = isEventSaved(event.id);
  const liked = isLiked(event.id);
  const [hovered, setHovered] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const attendingCount = event.attending || event.rsvpGoing || 0;
  const isVerified = (event.organizerReputationScore ?? 0) > 0 || event.isFeatured;

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current);
      }
    };
  }, []);

  const handleCardPress = useCallback(() => {
    router.push(eventPaths.detailRoute(event.id));
  }, [event.id]);

  const handleSavePress = useCallback(() => {
    toggleSaveEvent(event.id);
  }, [event.id, toggleSaveEvent]);

  const handleLikePress = useCallback(() => {
    toggleLike(event.id);
  }, [event.id, toggleLike]);

  const handleEdit = useCallback(() => {
    onEdit?.(event);
  }, [event, onEdit]);

  const handleAnalytics = useCallback(() => {
    router.push(`/dashboard/event-analytics/${event.id}`);
  }, [event.id]);

  const handleDelete = useCallback(() => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
    }
    setShowUndo(true);
    deleteTimerRef.current = setTimeout(() => {
      onDelete?.(event);
      setShowUndo(false);
      deleteTimerRef.current = null;
    }, 3500);
  }, [event, onDelete]);

  const handleUndo = useCallback(() => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    setShowUndo(false);
  }, []);

  const priceDisplay =
    event.priceLabel ??
    (event.priceCents === 0
      ? 'Free'
      : event.priceCents != null
        ? `$${(event.priceCents / 100).toFixed(2)}`
        : null);

  const isFreeDisplay =
    priceDisplay != null && String(priceDisplay).trim().toLowerCase() === 'free';

  const ageBadge =
    event.ageSuitability && event.ageSuitability !== 'all' ? event.ageSuitability : null;

  const cultureTags = mergeCultureTagFields(event.cultureTag, event.cultureTags).slice(0, 1);
  const cultureFlag = resolveEventCultureFlag(event);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        Platform.OS === 'web' && hovered && { borderColor: colors.border, transform: [{ scale: 1.01 }] },
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.cardTapArea,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }], backgroundColor: colors.backgroundSecondary },
        ]}
        onPress={handleCardPress}
        onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
        onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
        accessibilityRole="button"
        accessibilityLabel={`Event: ${event.title}, on ${event.date}`}
        accessibilityHint={`Double tap to view details for ${event.title}`}
      >
        <View style={[styles.imageContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <CultureImage
            uri={event.imageUrl ?? undefined}
            style={styles.image}
            contentFit="cover"
            recyclingKey={`event-${event.id}`}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={StyleSheet.absoluteFill}
          />
          {cultureFlag ? (
            <View style={styles.cultureFlagWrap}>
              <CultureFlagBadge emoji={cultureFlag} size="md" accessibilityLabel="Event culture flag" />
            </View>
          ) : null}
          {ageBadge ? (
            <View style={styles.ageBadgeWrap}>
              <Badge variant="error" shape="caps" size="sm">{ageBadge}</Badge>
            </View>
          ) : null}
          {isLive ? (
            <View style={styles.liveBadge}>
              <LinearGradient
                colors={gradients.coralPressed}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="pulse" size={12} color="white" style={{ marginRight: 4 }} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          ) : null}

          {/* Attendance count — bottom-left */}
          {attendingCount > 0 && (
            <View style={styles.attendingBadge}>
              <Ionicons name="people" size={10} color="#FFFFFF" />
              <Text style={styles.attendingBadgeText}>{attendingCount.toLocaleString()}</Text>
            </View>
          )}

          {/* Publisher brand logo tile — bottom-right (UNiDAYS pattern) */}
          {event.publisherProfileId ? (
            <View style={styles.publisherLogoWrap}>
              <EventPublisherLogo
                profileId={event.publisherProfileId}
                size={46}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.info}>
          <View style={styles.contentWrap}>
            {/* Trust Layer: Verification */}
            {isVerified && (
              <View style={styles.trustRow}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                <Text style={[styles.trustText, { color: colors.primary }]}>
                  {event.hostName ? `Verified by ${event.hostName}` : 'Community Verified'}
                </Text>
              </View>
            )}

            <Text style={[LuxeTextStyles.eventCardTitle, { color: colors.text, height: 44 }]} numberOfLines={2}>
              {event.title}
            </Text>

            <View style={styles.metaSection}>

              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={12} color={colors.eventDate} />
                {/* Luxe migration: using LuxeTextStyles + semantic eventDate color (never gold) */}
                <Text style={[LuxeTextStyles.eventCardDate, { color: colors.eventDate }]}> 
                  {formatEventDateTime(event.date, event.time)}
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.addToCalendarBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => exportEventToCalendar(event)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${event.title} to your device calendar`}
                  hitSlop={8}
                >
                  <Ionicons name="add-circle-outline" size={18} color={colors.eventDate} />
                </Pressable>
              </View>

              {event.venue ? (
                <View style={styles.meta}>
                  <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {event.venue}
                  </Text>
                </View>
              ) : null}

              {event.publisherProfileId ? (
                <View style={{ marginTop: 4 }}>
                  <EventPublisherLine profileId={event.publisherProfileId} />
                </View>
              ) : null}
            </View>
          </View>

          <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
            <View style={styles.footerLeft}>
              {event.category ? (
                <View
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: CultureTokens.violet + '14',
                      borderColor: CultureTokens.violet + '40',
                    },
                  ]}
                >
                  <Text style={[styles.categoryText, { color: CultureTokens.violet }]}>
                    {event.category}
                  </Text>
                </View>
              ) : null}
              <CultureTagRow tags={cultureTags} max={1} />
            </View>

            {priceDisplay ? (
              <View style={[styles.priceContainer, isFreeDisplay && { backgroundColor: CultureTokens.teal + '14', borderColor: CultureTokens.teal + '30' }]}>
                <Text style={[styles.price, { color: isFreeDisplay ? CultureTokens.teal : colors.text }]}>
                  {priceDisplay}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>

      <View style={styles.floatingActions}>
        <LikeToggle liked={liked} onToggle={handleLikePress} tone="glass" size="md" />
        <SaveToggle saved={isSaved} onToggle={handleSavePress} tone="glass" size="md" />
      </View>

      {canEdit ? (
        <View style={styles.crudActionsRow}>
          <Pressable
            onPress={handleAnalytics}
            style={({ pressed }) => [
              styles.crudBtn,
              { backgroundColor: colors.surface, borderColor: colors.borderLight },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`View analytics for event ${event.title}`}
          >
            <Ionicons name="bar-chart-outline" size={18} color={CultureTokens.violet} />
          </Pressable>
          <Pressable
            onPress={handleEdit}
            style={({ pressed }) => [
              styles.crudBtn,
              { backgroundColor: colors.surface, borderColor: colors.borderLight },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Edit event ${event.title}`}
          >
            <Ionicons name="create-outline" size={18} color={CultureTokens.indigo} />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.crudBtn,
              { backgroundColor: colors.surface, borderColor: colors.borderLight },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Delete event ${event.title}`}
          >
            <Ionicons name="trash-outline" size={18} color={CultureTokens.coral} />
          </Pressable>
        </View>
      ) : null}

      {showUndo ? (
        <View style={styles.snackbar} accessibilityLiveRegion="polite">
          <Text style={styles.snackbarText}>Event deleted</Text>
          <Pressable onPress={handleUndo} accessibilityRole="button" accessibilityLabel="Undo delete">
            <Text style={styles.snackbarUndo}>Undo</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const EventCardV2 = React.memo(EventCardV2Inner);
export default EventCardV2;

const styles = StyleSheet.create({
  card: {
    borderRadius: CardTokens.radius,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  cardTapArea: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cultureFlagWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  ageBadgeWrap: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    zIndex: 10,
    overflow: 'hidden',
  },
  // Live-badge text sits on the coral gradient — visual constant, theme-independent.
  liveBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  attendingBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 10,
  },
  attendingBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  publisherLogoWrap: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 10,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  trustText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  info: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 180,
  },
  contentWrap: {
    flex: 1,
    marginBottom: 12,
  },
  metaSection: {
    marginTop: 8,
    gap: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addToCalendarBtn: {
    marginLeft: 8,
    padding: 2,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    flex: 1,
    opacity: 0.8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 'auto',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  priceContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  price: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  floatingActions: {
    position: 'absolute',
    right: 12,
    top: 144,
    flexDirection: 'row',
    gap: 8,
    zIndex: 20,
  },
  crudActionsRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: 10,
    right: 10,
    gap: 8,
    zIndex: 10,
  },
  crudBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    borderWidth: 1,
  },
  // Always-dark snackbar — high-contrast across themes; intentional visual constant.
  snackbar: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    right: 18,
    backgroundColor: '#222',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  snackbarText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
  },
  snackbarUndo: {
    color: CultureTokens.gold,
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    marginLeft: 18,
  },
});
