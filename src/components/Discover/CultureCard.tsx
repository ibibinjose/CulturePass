import React from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CardGrammar } from '@/design-system/ui/CardGrammar';
import { useLikes } from '@/contexts/LikesContext';
import type { CultureCardModel } from '@/shared/schema';

interface CultureCardProps {
  item: CultureCardModel;
}

function iconForEntity(entityType: CultureCardModel['entityType']): keyof typeof Ionicons.glyphMap {
  if (entityType === 'event') return 'calendar-outline';
  if (entityType === 'business') return 'storefront-outline';
  if (entityType === 'artist') return 'mic-outline';
  if (entityType === 'venue') return 'location-outline';
  return 'people-outline';
}

export function CultureCard({ item }: CultureCardProps) {
  const { isLiked, toggleLike } = useLikes();
  const liked = isLiked(item.id);

  const trustChips = [
    item.trust.isVerified ? 'Verified' : null,
    item.trust.socialProof ?? null,
  ].filter((chip): chip is string => Boolean(chip));

  return (
    <CardGrammar
      title={item.title}
      subtitle={item.subtitle}
      meta={item.meta}
      imageUrl={item.imageUrl}
      trustChips={trustChips}
      ctaLabel={item.primaryAction.label}
      onPress={() => router.push(item.primaryAction.route as never)}
      accessibilityLabel={`${item.title}, ${item.primaryAction.label}`}
      iconName={iconForEntity(item.entityType)}
      isLiked={liked}
      onLikeToggle={() => toggleLike(item.id)}
    />
  );
}
