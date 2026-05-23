import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { Review } from '@/shared/schema';

interface ProfileReviewsProps {
  reviews: Review[] | undefined;
}

function timeAgo(dateStr: string | Date | null) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

export function ProfileReviews({ reviews }: ProfileReviewsProps) {
  const colors = useColors();
  if (!reviews || reviews.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Reviews ({reviews.length})</Text>
      {reviews.slice(0, 5).map((review) => (
        <View
          key={review.id}
          style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        >
          <View style={styles.reviewHeader}>
            <View style={[styles.reviewAvatar, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="person" size={16} color={colors.textSecondary} />
            </View>
            <View style={styles.reviewerInfo}>
              <Text style={[styles.reviewerName, { color: colors.text }]}>{'Anonymous'}</Text>
              <View style={styles.miniStars}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Ionicons
                    key={i}
                    name={i < review.rating ? 'star' : 'star-outline'}
                    size={12}
                    color={colors.accent}
                  />
                ))}
              </View>
            </View>
            <Text style={[styles.reviewDate, { color: colors.textTertiary }]}>
              {timeAgo(review.createdAt)}
            </Text>
          </View>
          {review.comment ? (
            <Text style={[styles.reviewBody, { color: colors.textSecondary }]}>{review.comment}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 10,
  },
  reviewCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  miniStars: { flexDirection: 'row', gap: 1 },
  reviewDate: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
  reviewBody: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
});
