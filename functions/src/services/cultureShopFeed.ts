import { db, isFirestoreConfigured } from '../admin';
import { allowInlineDemoFallback } from '../dev/demoFixtures';
import { shoppingService } from './shopping';
import type {
  MarketplaceFeedResponse,
  MarketplaceSection,
  MarketplaceTile,
} from '../../../shared/schema/marketplaceFeed';
import type { ShopData } from '../../../shared/schema/shopping';

function shopToTile(shop: ShopData): MarketplaceTile {
  const activeDeal = shop.deals?.find((d) => d.isActive) ?? shop.deals?.[0];
  return {
    id: shop.id,
    kind: 'shop',
    title: shop.name,
    subtitle: shop.city,
    imageUrl: shop.imageUrl || null,
    badge: activeDeal?.discount ?? null,
    href: `/shopping/${shop.id}`,
    premiumLocked: false,
  };
}

function perkDocToTile(data: Record<string, unknown>, id: string): MarketplaceTile {
  const discount = typeof data.discountPercent === 'number' ? data.discountPercent : undefined;
  const badge = discount != null && discount > 0 ? `${Math.round(discount)}% off` : null;
  const membershipReq =
    data.isMembershipRequired === true ||
    (typeof data.requiredMembershipTier === 'string' && data.requiredMembershipTier.length > 0);
  return {
    id,
    kind: 'perk',
    title: String(data.title ?? 'Offer'),
    subtitle:
      typeof data.partnerName === 'string'
        ? data.partnerName
        : typeof data.city === 'string'
          ? data.city
          : null,
    imageUrl: typeof data.coverUrl === 'string' ? data.coverUrl : null,
    badge,
    href: `/perks/${id}`,
    premiumLocked: membershipReq,
  };
}

function categoryLabel(raw: string): string {
  const t = raw.trim();
  if (!t) return 'Featured';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function mockMarketplaceFeed(): MarketplaceFeedResponse {
  return {
    heroTagline: 'Discover fashion, food, tech and more — curated for CulturePass members.',
    sections: [
      {
        id: 'mock-just-in',
        title: 'Just in',
        subtitle: 'Preview tiles while listings load',
        viewMoreHref: '/offers',
        viewMoreLabel: 'View more',
        items: [
          {
            id: 'mock-p1',
            kind: 'perk',
            title: 'Member dining savings',
            subtitle: 'Partner venues',
            badge: '20% off',
            href: '/offers',
            imageUrl: null,
            premiumLocked: false,
          },
          {
            id: 'mock-s1',
            kind: 'shop',
            title: 'Culture marketplace',
            subtitle: 'Sydney',
            badge: 'Deals',
            href: '/shopping',
            imageUrl: null,
            premiumLocked: false,
          },
        ],
      },
      {
        id: 'mock-fashion',
        title: 'Fashion & lifestyle',
        subtitle: 'Stores & services',
        viewMoreHref: '/shopping',
        viewMoreLabel: 'View more',
        items: [
          {
            id: 'mock-s2',
            kind: 'shop',
            title: 'Browse shopping',
            subtitle: 'Local picks',
            badge: null,
            href: '/shopping',
            imageUrl: null,
            premiumLocked: false,
          },
        ],
      },
    ],
  };
}

export async function buildMarketplaceFeed(opts: {
  city?: string;
  country?: string;
}): Promise<MarketplaceFeedResponse> {
  const city = opts.city?.trim();
  const country = opts.country?.trim();

  let shops: ShopData[] = [];
  try {
    shops = await shoppingService.list({});
  } catch {
    shops = [];
  }

  shops = shops.filter((s) => {
    if (city && s.city !== city) return false;
    if (country && s.country !== country) return false;
    return true;
  });

  shops.sort((a, b) => Number(b.isPromoted) - Number(a.isPromoted) || a.name.localeCompare(b.name));

  const shopByCat = new Map<string, ShopData[]>();
  for (const s of shops) {
    const cat = categoryLabel(s.category || 'Shopping');
    const arr = shopByCat.get(cat) ?? [];
    arr.push(s);
    shopByCat.set(cat, arr);
  }

  type PerkRow = { id: string; data: Record<string, unknown> };
  let perkRows: PerkRow[] = [];
  try {
    if (isFirestoreConfigured) {
      const snap = await db.collection('perks').where('status', '==', 'active').limit(150).get();
      perkRows = snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }));
    }
  } catch {
    perkRows = [];
  }

  perkRows = perkRows.filter(({ data: p }) => {
    if (city && typeof p.city === 'string' && p.city !== city) return false;
    if (country && typeof p.country === 'string' && p.country !== country) return false;
    return true;
  });

  const perkByCat = new Map<string, PerkRow[]>();
  for (const row of perkRows) {
    const cats = Array.isArray(row.data.categories) ? (row.data.categories as string[]) : [];
    const single = typeof row.data.category === 'string' ? row.data.category : '';
    const keyRaw = cats[0] || single || 'Member offers';
    const cat = categoryLabel(keyRaw);
    const arr = perkByCat.get(cat) ?? [];
    arr.push(row);
    perkByCat.set(cat, arr);
  }

  const sections: MarketplaceSection[] = [];

  const sortedByCreated = [...perkRows].sort((a, b) => {
    const ta = Date.parse(String(a.data.createdAt ?? '')) || 0;
    const tb = Date.parse(String(b.data.createdAt ?? '')) || 0;
    return tb - ta;
  });
  const justIn = sortedByCreated.slice(0, 8).map((r) => perkDocToTile(r.data, r.id));
  if (justIn.length > 0) {
    sections.push({
      id: 'just-in',
      title: 'Just in',
      subtitle: 'New perks and partner deals',
      viewMoreHref: '/offers',
      viewMoreLabel: 'View more',
      items: justIn,
    });
  }

  const shopCategories = [...shopByCat.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [title, list] of shopCategories) {
    const items = list.slice(0, 8).map(shopToTile);
    sections.push({
      id: `shop-${title}`,
      title,
      subtitle: 'Stores & services',
      viewMoreHref: '/shopping',
      viewMoreLabel: 'View more',
      items,
    });
  }

  const perkCategories = [...perkByCat.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [title, list] of perkCategories) {
    const sectionTitle = shopByCat.has(title) ? `${title} · Member offers` : title;
    const items = list.slice(0, 8).map((r) => perkDocToTile(r.data, r.id));
    sections.push({
      id: `perk-${title}`,
      title: sectionTitle,
      subtitle: 'Member offers',
      viewMoreHref: '/offers',
      viewMoreLabel: 'View more',
      items,
    });
  }

  if (sections.length === 0) {
    if (allowInlineDemoFallback()) return mockMarketplaceFeed();
    return {
      sections: [],
      heroTagline: 'Save on brands you love — fashion, food, tech and experiences near you.',
    };
  }

  return {
    sections,
    heroTagline: 'Save on brands you love — fashion, food, tech and experiences near you.',
  };
}
