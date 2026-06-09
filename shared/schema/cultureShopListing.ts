/**
 * CultureMarket Listings — types for the cultural marketplace.
 * Businesses can list products for sale, offer services, or link to their site.
 */

export type ShopListingType = 'product' | 'service' | 'link';
export type ShopListingStatus = 'draft' | 'active' | 'sold' | 'paused';

export interface ShopListing {
  id: string;
  /** 'product' → priced item; 'service' → bookable; 'link' → drives to external site */
  type: ShopListingType;
  title: string;
  description: string;
  category: string;
  subcategory?: string;

  // ── Pricing ──────────────────────────────────────────────────────────────
  priceCents?: number | null;
  isFree: boolean;
  currency: string;

  // ── Media ─────────────────────────────────────────────────────────────────
  imageUrl?: string | null;
  /** Square brand/seller logo shown as white tile overlay (bottom-right of card) */
  logoUrl?: string | null;
  accentKey?: 'violet' | 'coral' | 'teal' | 'gold';

  // ── Seller ────────────────────────────────────────────────────────────────
  sellerName: string;
  sellerUserId: string;
  sellerProfileId?: string | null;
  sellerAvatarUrl?: string | null;

  // ── External / contact ───────────────────────────────────────────────────
  externalUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;

  // ── Location & culture ────────────────────────────────────────────────────
  city?: string | null;
  country?: string | null;
  isOnline: boolean;
  cultureTags?: string[];
  cityTags?: string[];

  // ── Status ────────────────────────────────────────────────────────────────
  status: ShopListingStatus;
  isFeatured: boolean;
  tags?: string[];
  cultureTag?: string | null;

  // ── Stats ─────────────────────────────────────────────────────────────────
  viewCount: number;
  saveCount: number;

  // ── Timestamps ────────────────────────────────────────────────────────────
  createdAt: string;
  updatedAt: string;
}

// ─── Category taxonomy ────────────────────────────────────────────────────────

export interface MarketSubcategory {
  id: string;
  label: string;
}

export interface MarketCategory {
  id: string;
  label: string;
  icon: string;
  accentKey: 'violet' | 'coral' | 'teal' | 'gold';
  subcategories: MarketSubcategory[];
}

export const MARKET_CATEGORIES: MarketCategory[] = [
  {
    id: 'learning-wellbeing',
    label: 'Learning & Wellbeing',
    icon: 'book-outline',
    accentKey: 'teal',
    subcategories: [],
  },
  {
    id: 'fashion',
    label: 'Fashion',
    icon: 'shirt-outline',
    accentKey: 'coral',
    subcategories: [
      { id: 'fashion_womenswear', label: 'Womenswear' },
      { id: 'fashion_menswear', label: 'Menswear' },
      { id: 'fashion_shoes', label: 'Shoes' },
      { id: 'fashion_accessories', label: 'Accessories' },
      { id: 'fashion_lingerie', label: 'Lingerie & Underwear' },
      { id: 'fashion_activewear', label: 'Activewear' },
    ],
  },
  {
    id: 'beauty',
    label: 'Beauty',
    icon: 'sparkles-outline',
    accentKey: 'coral',
    subcategories: [
      { id: 'beauty_makeup', label: 'Make up' },
      { id: 'beauty_skincare', label: 'Skincare' },
      { id: 'beauty_fragrance', label: 'Fragrance' },
      { id: 'beauty_health', label: 'Health & Wellbeing' },
      { id: 'beauty_haircare', label: 'Haircare & Tools' },
    ],
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    icon: 'heart-outline',
    accentKey: 'violet',
    subcategories: [
      { id: 'lifestyle_travel', label: 'Travel & Transport' },
      { id: 'lifestyle_subscriptions', label: 'Subscriptions' },
      { id: 'lifestyle_home-banking', label: 'Home & Banking' },
      { id: 'lifestyle_books', label: 'Books & Stationery' },
      { id: 'lifestyle_holidays', label: 'Holidays & Hotels' },
    ],
  },
  {
    id: 'food-drink',
    label: 'Food & Drink',
    icon: 'restaurant-outline',
    accentKey: 'gold',
    subcategories: [
      { id: 'food_takeaway', label: 'Takeaway & delivery' },
      { id: 'food_dine-out', label: 'Dine Out' },
      { id: 'food_home-cooking', label: 'Home Cooking' },
    ],
  },
  {
    id: 'health-fitness',
    label: 'Health & Fitness',
    icon: 'fitness-outline',
    accentKey: 'teal',
    subcategories: [
      { id: 'fitness_clothing', label: 'Fitness Clothing' },
      { id: 'fitness_supplements', label: 'Protein & Supplements' },
      { id: 'fitness_gym-apps', label: 'Gym & Fitness Apps' },
      { id: 'fitness_accessories', label: 'Fitness Accessories' },
      { id: 'fitness_eyecare', label: 'Eyecare' },
    ],
  },
  {
    id: 'technology',
    label: 'Technology',
    icon: 'laptop-outline',
    accentKey: 'violet',
    subcategories: [
      { id: 'tech_laptops-tablets', label: 'Laptops & Tablets' },
      { id: 'tech_accessories', label: 'Accessories' },
      { id: 'tech_mobile', label: 'Mobile' },
      { id: 'tech_desktops', label: 'Desktops' },
      { id: 'tech_gaming', label: 'Gaming' },
      { id: 'tech_software', label: 'Software & Subscriptions' },
    ],
  },
  {
    id: 'sports-media',
    label: 'Sports & Media',
    icon: 'basketball-outline',
    accentKey: 'coral',
    subcategories: [],
  },
  {
    id: 'education',
    label: 'Education',
    icon: 'school-outline',
    accentKey: 'teal',
    subcategories: [],
  },
  {
    id: 'home',
    label: 'Home',
    icon: 'home-outline',
    accentKey: 'violet',
    subcategories: [],
  },
  {
    id: 'student-life',
    label: 'Student Life',
    icon: 'people-outline',
    accentKey: 'teal',
    subcategories: [],
  },
  {
    id: 'hair-beauty',
    label: 'Hair & Beauty',
    icon: 'cut-outline',
    accentKey: 'coral',
    subcategories: [],
  },
  {
    id: 'music',
    label: 'Music',
    icon: 'musical-notes-outline',
    accentKey: 'violet',
    subcategories: [],
  },
];

// ─── Culture tags ─────────────────────────────────────────────────────────────

export const CULTURE_TAGS: string[] = [
  'Australian',
  'Mateship',
  'Fair Go',
  'Beach Culture',
  'Cafe Culture',
  'Pub Culture',
  'Barbie Culture',
  'ANZAC',
  'Dreamtime',
  'Indigenous Heritage',
  'AFL & NRL',
  'Cricket & Surfing',
  'Pub Rock',
  'Larrikinism',
  'Outback & Bush',
  'Aboriginal & Torres Strait Islander',
  'African',
  'Arab / Middle Eastern',
  'Bangladeshi',
  'Caribbean',
  'Chinese',
  'East African',
  'Filipino',
  'Greek',
  'Indian',
  'Indigenous',
  'Japanese',
  'Korean',
  'Lebanese',
  'Malay / Malaysian',
  'Nepali',
  'Nigerian',
  'Pakistani',
  'Persian / Iranian',
  'Pasifika / Pacific Islander',
  'Portuguese',
  'Punjabi / Sikh',
  'Sri Lankan',
  'Tamil',
  'Turkish',
  'Vietnamese',
  'West African',
];

// ─── City / location tags ──────────────────────────────────────────────────────

export const CITY_TAGS: string[] = [
  'Sydney',
  'Melbourne',
  'Brisbane',
  'Perth',
  'Adelaide',
  'Gold Coast',
  'Newcastle',
  'Canberra',
  'Hobart',
  'Darwin',
  'Auckland',
  'Wellington',
  'Christchurch',
  'Online / Nationwide',
];

// ─── Legacy compat — keep SHOP_CATEGORIES pointing at parent categories ────────

export const SHOP_CATEGORIES = MARKET_CATEGORIES;
export type ShopListingCategory = string;
export type MarketCategoryId = string;

// ─── API shapes ───────────────────────────────────────────────────────────────

export interface ShopListingsResponse {
  listings: ShopListing[];
  total: number;
  hasMore: boolean;
}

export interface CreateShopListingInput {
  type: ShopListingType;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  priceCents?: number;
  isFree: boolean;
  currency?: string;
  imageUrl?: string;
  logoUrl?: string;
  externalUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  city?: string;
  country?: string;
  isOnline?: boolean;
  tags?: string[];
  cultureTag?: string;
  cultureTags?: string[];
  cityTags?: string[];
}

export interface UpdateShopListingInput extends Partial<CreateShopListingInput> {
  status?: ShopListingStatus;
}

// ─── Mock listings ────────────────────────────────────────────────────────────

export function getMockShopListings(): ShopListing[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'mock-listing-1',
      type: 'product',
      title: 'Hand-Embroidered Silk Dupatta',
      description:
        'Beautiful hand-crafted silk dupatta with traditional Indian embroidery. Perfect for weddings, festivals, and cultural occasions.',
      category: 'fashion',
      subcategory: 'fashion_accessories',
      priceCents: 8900,
      isFree: false,
      currency: 'AUD',
      imageUrl: null,
      logoUrl: null,
      accentKey: 'coral',
      sellerName: 'Priya Crafts',
      sellerUserId: 'mock-seller-1',
      isOnline: true,
      status: 'active',
      isFeatured: true,
      city: 'Sydney',
      country: 'AU',
      cultureTags: ['Indian'],
      cityTags: ['Sydney'],
      cultureTag: 'Indian',
      viewCount: 142,
      saveCount: 18,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'mock-listing-2',
      type: 'service',
      title: 'Authentic Kerala Sadya Catering',
      description:
        'Traditional Kerala Sadya feast for events, weddings, and celebrations. 20+ dishes served on banana leaf. Min 30 guests. Sydney metro area.',
      category: 'food-drink',
      subcategory: 'food_dine-out',
      priceCents: 3500,
      isFree: false,
      currency: 'AUD',
      imageUrl: null,
      logoUrl: null,
      accentKey: 'gold',
      sellerName: 'Kerala Kitchen Sydney',
      sellerUserId: 'mock-seller-2',
      isOnline: false,
      status: 'active',
      isFeatured: true,
      city: 'Sydney',
      country: 'AU',
      cultureTags: ['Indian'],
      cityTags: ['Sydney'],
      contactPhone: '+61 400 000 001',
      viewCount: 89,
      saveCount: 12,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'mock-listing-3',
      type: 'link',
      title: 'Batik & Wax Print Fabric Store',
      description:
        'Premium African wax print fabrics, Ankara prints, and Kente cloth. Order online — delivery across Australia and New Zealand.',
      category: 'fashion',
      subcategory: 'fashion_accessories',
      isFree: false,
      currency: 'AUD',
      imageUrl: null,
      logoUrl: null,
      accentKey: 'violet',
      sellerName: 'Afro Threads AU',
      sellerUserId: 'mock-seller-3',
      externalUrl: 'https://example.com/afro-threads',
      isOnline: true,
      status: 'active',
      isFeatured: false,
      country: 'AU',
      cultureTags: ['African', 'West African'],
      cityTags: ['Online / Nationwide'],
      viewCount: 204,
      saveCount: 31,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'mock-listing-4',
      type: 'service',
      title: 'Henna & Mehndi Artist',
      description:
        'Professional henna and mehndi artist for weddings, Eid, Diwali, and all cultural events. Bridal packages available. Melbourne & surrounds.',
      category: 'hair-beauty',
      priceCents: 15000,
      isFree: false,
      currency: 'AUD',
      imageUrl: null,
      logoUrl: null,
      accentKey: 'coral',
      sellerName: 'Layla Henna Art',
      sellerUserId: 'mock-seller-4',
      isOnline: false,
      status: 'active',
      isFeatured: false,
      city: 'Melbourne',
      country: 'AU',
      cultureTags: ['Indian', 'Arab / Middle Eastern'],
      cityTags: ['Melbourne'],
      contactPhone: '+61 400 000 002',
      viewCount: 67,
      saveCount: 8,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'mock-listing-5',
      type: 'product',
      title: 'Filipino Ube Jam Gift Boxes',
      description:
        'Homemade ube jam gift boxes — pistachio, walnut, and cashew varieties. 24-piece box. Made fresh to order. Ships Australia-wide.',
      category: 'food-drink',
      subcategory: 'food_home-cooking',
      priceCents: 4500,
      isFree: false,
      currency: 'AUD',
      imageUrl: null,
      logoUrl: null,
      accentKey: 'violet',
      sellerName: 'Ate Rosa Homemade',
      sellerUserId: 'mock-seller-5',
      isOnline: true,
      status: 'active',
      isFeatured: false,
      country: 'AU',
      cultureTags: ['Filipino'],
      cityTags: ['Online / Nationwide'],
      viewCount: 55,
      saveCount: 7,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'mock-listing-6',
      type: 'service',
      title: 'Mandarin & Cantonese Tutoring',
      description:
        'Experienced Mandarin and Cantonese tutor for all ages. Online sessions. HSC, beginner, and conversation classes.',
      category: 'education',
      priceCents: 8000,
      isFree: false,
      currency: 'AUD',
      imageUrl: null,
      logoUrl: null,
      accentKey: 'teal',
      sellerName: 'Lin Language Studio',
      sellerUserId: 'mock-seller-6',
      isOnline: true,
      status: 'active',
      isFeatured: false,
      city: 'Sydney',
      country: 'AU',
      cultureTags: ['Chinese'],
      cityTags: ['Sydney', 'Online / Nationwide'],
      contactEmail: 'lin@example.com',
      viewCount: 93,
      saveCount: 14,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'mock-listing-7',
      type: 'link',
      title: 'Pacific Island Art & Prints',
      description:
        'Original Pacific Island-inspired art prints in multiple sizes. Tapa cloth designs, ocean motifs, and custom commissions.',
      category: 'lifestyle',
      priceCents: undefined,
      isFree: false,
      currency: 'AUD',
      imageUrl: null,
      logoUrl: null,
      accentKey: 'teal',
      sellerName: 'Moana Designs',
      sellerUserId: 'mock-seller-7',
      externalUrl: 'https://example.com/moana-designs',
      isOnline: true,
      status: 'active',
      isFeatured: false,
      country: 'AU',
      cultureTags: ['Pasifika / Pacific Islander'],
      cityTags: ['Online / Nationwide'],
      viewCount: 38,
      saveCount: 5,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'mock-listing-8',
      type: 'product',
      title: 'Lebanese Baklava Assortment Box',
      description:
        'Premium Lebanese baklava — pistachio, walnut, and cashew varieties. 24-piece gift box. Made fresh to order in Melbourne.',
      category: 'food-drink',
      subcategory: 'food_home-cooking',
      priceCents: 5500,
      isFree: false,
      currency: 'AUD',
      imageUrl: null,
      logoUrl: null,
      accentKey: 'gold',
      sellerName: 'Beirut Sweets Melbourne',
      sellerUserId: 'mock-seller-8',
      isOnline: true,
      status: 'active',
      isFeatured: false,
      city: 'Melbourne',
      country: 'AU',
      cultureTags: ['Lebanese', 'Arab / Middle Eastern'],
      cityTags: ['Melbourne'],
      viewCount: 121,
      saveCount: 22,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
