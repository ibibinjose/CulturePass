import { useMemo } from 'react';
import type { MovieData, PerkData, RestaurantData, ShopData } from '@/shared/schema';
import type { PreviewItem } from '@/shared/schema/browse';
import { CultureTokens } from '@/design-system/tokens/theme';

type UseDiscoverPreviewRailsParams = {
  restaurantsRaw: RestaurantData[];
  restaurantsLoading: boolean;
  moviesRaw: MovieData[];
  moviesLoading: boolean;
  shoppingRaw: ShopData[];
  shoppingLoading: boolean;
  perksRaw: PerkData[];
  perksLoading: boolean;
};

export function useDiscoverPreviewRails({
  restaurantsRaw,
  restaurantsLoading,
  moviesRaw,
  moviesLoading,
  shoppingRaw,
  shoppingLoading,
  perksRaw,
  perksLoading,
}: UseDiscoverPreviewRailsParams) {
  const restaurantPreviewItems = useMemo((): (PreviewItem | 'skeleton')[] => {
    if (restaurantsLoading) return ['skeleton', 'skeleton', 'skeleton', 'skeleton'];
    return restaurantsRaw.slice(0, 8).map((r) => ({
      id: r.id,
      imageUrl: r.imageUrl,
      title: r.name,
      subtitle: `${r.cuisine} · ${r.priceRange}`,
      badge: r.isOpen ? 'Open' : undefined,
      badgeColor: r.isOpen ? '#34C759' : undefined,
      route: `/r/${r.id}`,
    }));
  }, [restaurantsRaw, restaurantsLoading]);

  const moviePreviewItems = useMemo((): (PreviewItem | 'skeleton')[] => {
    if (moviesLoading) return ['skeleton', 'skeleton', 'skeleton', 'skeleton'];
    return moviesRaw.slice(0, 8).map((m) => ({
      id: m.id,
      imageUrl: m.posterUrl,
      title: m.title,
      subtitle: Array.isArray(m.genre) ? m.genre[0] : m.genre,
      badge: m.rating,
      badgeColor: '#1C1C1E',
      route: `/m/${m.id}`,
    }));
  }, [moviesRaw, moviesLoading]);

  const shoppingPreviewItems = useMemo((): (PreviewItem | 'skeleton')[] => {
    if (shoppingLoading) return ['skeleton', 'skeleton', 'skeleton', 'skeleton'];
    return shoppingRaw.slice(0, 8).map((s) => ({
      id: s.id,
      imageUrl: s.imageUrl,
      title: s.name,
      subtitle: s.category,
      badge: s.deliveryAvailable ? 'Delivery' : s.isOpen ? 'Open' : undefined,
      badgeColor: s.deliveryAvailable ? CultureTokens.teal : '#34C759',
      route: `/s/${s.id}`,
    }));
  }, [shoppingRaw, shoppingLoading]);

  const perksPreviewItems = useMemo((): (PreviewItem | 'skeleton')[] => {
    if (perksLoading) return ['skeleton', 'skeleton', 'skeleton', 'skeleton'];
    return perksRaw.slice(0, 8).map((p) => ({
      id: p.id,
      imageUrl: p.coverUrl,
      title: p.title,
      subtitle: p.partnerName ?? p.categories?.[0],
      badge: p.discountPercent ? `${p.discountPercent}% off` : p.perkType,
      badgeColor: CultureTokens.indigo,
      route: `/p/${p.id}`,
    }));
  }, [perksRaw, perksLoading]);

  return {
    restaurantPreviewItems,
    moviePreviewItems,
    shoppingPreviewItems,
    perksPreviewItems,
  };
}

