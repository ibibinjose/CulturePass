import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, Colors, TextStyles } from '@/design-system/tokens/theme';
import type { FeedItem } from '@/shared/schema/feedItem';

interface FeedCardProps {
  item: FeedItem;
}

function formatDateDisplay(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-AU', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function TimeAgo({ dateStr }: { dateStr: string }) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  let text = 'Just now';
  if (days > 0) text = `${days}d ago`;
  else if (hours > 0) text = `${hours}h ago`;
  else if (minutes > 0) text = `${minutes}m ago`;

  return <Text style={styles.timeAgo}>{text}</Text>;
}

export default function FeedCard({ item }: FeedCardProps) {
  const colors = useColors();
  const { payload = {}, type, communityId, createdAt, referenceId } = item;

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (type === 'event_created' || type === 'event_reminder') {
      router.push({ pathname: '/e/[id]', params: { id: referenceId } });
    } else if (type === 'perk_added') {
      router.push('/perks');
    } else if (type === 'announcement') {
      // Could route to community details for now
      router.push({ pathname: '/c/[id]', params: { id: communityId } });
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'event_created':
        return (
          <View style={styles.contentWrap}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={[styles.avatarBox, { backgroundColor: CultureTokens.indigo + '20' }]}>
                  {payload.authorAvatar ? (
                    <Image source={{ uri: payload.authorAvatar }} style={StyleSheet.absoluteFillObject} />
                  ) : (
                    <Ionicons name="calendar" size={16} color={CultureTokens.indigo} />
                  )}
                </View>
                <View>
                  <Text style={[styles.authorName, { color: colors.text }]}>New Event • {communityId}</Text>
                  <TimeAgo dateStr={createdAt} />
                </View>
              </View>
            </View>
            <View style={styles.mediaContainer}>
              {payload.imageUrl ? (
                <Image source={{ uri: payload.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
              ) : (
                <LinearGradient
                  colors={[CultureTokens.indigo, '#EBF5FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
            </View>
            <View style={[styles.mediaInfoBlock, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Text style={[TextStyles.eventCardTitle, { color: colors.text }]} numberOfLines={2}>
                {payload.title}
              </Text>
              {payload.date ? (
                <Text style={[TextStyles.eventCardDate, { color: colors.eventDate }]}>
                  {formatDateDisplay(payload.date)}
                </Text>
              ) : null}
              {payload.venue ? (
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={12} color={colors.textSecondary} />
                  <Text style={[styles.locationTextMedia, { color: colors.textSecondary }]} numberOfLines={1}>
                    {payload.venue}
                  </Text>
                </View>
              ) : null}
            </View>
            {payload.description ? (
              <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                {payload.description}
              </Text>
            ) : null}
          </View>
        );

      case 'announcement':
        return (
          <View style={styles.contentWrap}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={[styles.avatarBox, { backgroundColor: CultureTokens.teal + '20' }]}>
                  {payload.authorAvatar ? (
                    <Image source={{ uri: payload.authorAvatar }} style={StyleSheet.absoluteFillObject} />
                  ) : (
                    <Ionicons name="megaphone" size={16} color={CultureTokens.teal} />
                  )}
                </View>
                <View>
                  <Text style={[styles.authorName, { color: colors.text }]}>{payload.authorName || communityId}</Text>
                  <TimeAgo dateStr={createdAt} />
                </View>
              </View>
              <View style={[styles.badgePill, { backgroundColor: colors.surfaceElevated, borderColor: CultureTokens.teal + '66' }]}>
                <Text style={[styles.badgeText, { color: colors.text }]}>Announcement</Text>
              </View>
            </View>
            <Text style={[styles.announcementTitle, { color: colors.text }]}>{payload.title}</Text>
            {payload.description ? (
              <Text style={[styles.description, { color: colors.textSecondary, marginTop: 4 }]} numberOfLines={4}>
                {payload.description}
              </Text>
            ) : null}
          </View>
        );

      case 'perk_added':
        return (
          <View style={styles.contentWrap}>
             <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={[styles.avatarBox, { backgroundColor: colors.accent + '20' }]}> 
                  {payload.authorAvatar ? (
                    <Image source={{ uri: payload.authorAvatar }} style={StyleSheet.absoluteFillObject} />
                  ) : (
                    <Ionicons name="gift" size={16} color={colors.accent} />
                  )}
                </View>
                <View>
                  <Text style={[styles.authorName, { color: colors.text }]}>New Perk • {communityId}</Text>
                  <TimeAgo dateStr={createdAt} />
                </View>
              </View>
            </View>
            <View style={[styles.ticketBox, { backgroundColor: colors.accent + '10', borderColor: colors.accent + '30' }]}> 
              <View style={styles.ticketLeft}>
                <Ionicons name="star" size={24} color={colors.accent} />
                <View style={styles.ticketInfo}>
                  <Text style={[styles.ticketTitle, { color: colors.text }]}>{payload.title}</Text>
                  {payload.description ? (
                    <Text style={[styles.ticketDesc, { color: colors.textSecondary }]} numberOfLines={2}>{payload.description}</Text>
                  ) : null}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.accent} />
            </View>
          </View>
        );

      case 'event_reminder':
        return (
          <View style={styles.contentWrap}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={[styles.avatarBox, { backgroundColor: CultureTokens.coral + '20' }]}>
                   <Ionicons name="time" size={16} color={CultureTokens.coral} />
                </View>
                <View>
                  <Text style={[styles.authorName, { color: colors.text }]}>Reminder • {communityId}</Text>
                  <TimeAgo dateStr={createdAt} />
                </View>
              </View>
              <View style={[styles.badgePill, { backgroundColor: colors.surfaceElevated, borderColor: CultureTokens.coral + '66' }]}>
                <Text style={[styles.badgeText, { color: colors.text }]}>Happening Soon</Text>
              </View>
            </View>
            <View style={styles.reminderCard}>
              <View style={styles.reminderContent}>
                <Text style={[styles.announcementTitle, { color: colors.text }]} numberOfLines={2}>{payload.title}</Text>
                <View style={[styles.locationRow, { marginTop: 6 }]}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.locationTextMedia, { color: colors.textSecondary }]}>{payload.date ? formatDateDisplay(payload.date) : 'Soon'}</Text>
                </View>
              </View>
              {payload.imageUrl ? (
                <Image source={{ uri: payload.imageUrl }} style={styles.reminderThumb} contentFit="cover" />
              ) : null}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
          pressed && !Platform.isTV && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          Platform.OS === 'web' && { cursor: 'pointer' as any },
          Colors.shadows.medium
        ]}
        onPress={handlePress}
      >
        {renderContent()}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 20,
    width: '100%',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  contentWrap: {
    padding: 18,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  authorName: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.4)',
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Media Styles (Event Created)
  mediaContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 4,
    position: 'relative',
  },
  mediaInfoBlock: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    gap: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationTextMedia: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
  },

  // Announcement Styles
  announcementTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 24,
    marginTop: 4,
  },

  // Perk Styles
  ticketBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 6,
  },
  ticketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  ticketInfo: {
    flex: 1,
    gap: 2,
  },
  ticketTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  ticketDesc: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },

  // Reminder Styles
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  reminderContent: {
    flex: 1,
  },
  reminderThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
  }
});
