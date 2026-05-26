/**
 * CultureMarket listing creation (product, service, or external link).
 * Routed from /hostspace/create/listing (see app/hostspace/create/listing.tsx).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { fetchListingWithFallback } from '@/lib/cultureShopDeals';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import {
  CultureTokens,
  FontFamily,
  SignatureGradient,
} from '@/design-system/tokens/theme';
import { Radius, Spacing } from '@/design-system/tokens/spacing';
import type { CreateShopListingInput, ShopListing, ShopListingType } from '@/shared/schema';
import { MARKET_CATEGORIES, CULTURE_TAGS, CITY_TAGS } from '@/shared/schema/cultureShopListing';

export type CultureMarketListingWizardProps = {
  variant?: 'fullscreen' | 'embedded';
  /** When variant is embedded, edit this listing id (ignores URL ?edit=). */
  embeddedEditId?: string | null;
  /** When variant is embedded, skip type picker when set (product | service | link). */
  embeddedInitialType?: ShopListingType;
  onClose?: () => void;
  /** Called after create/update when embedded; fullscreen navigates to CultureMarket detail instead. */
  onListingPublished?: (listing: ShopListing) => void;
};

// ─── Listing type options ─────────────────────────────────────────────────────

const TYPE_OPTIONS: {
  type: ShopListingType;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  color: string;
}[] = [
  {
    type: 'product',
    icon: 'cube-outline',
    title: 'Sell a product',
    desc: 'Physical or digital item — buyers purchase or contact you.',
    color: CultureTokens.coral,
  },
  {
    type: 'service',
    icon: 'briefcase-outline',
    title: 'Offer a service',
    desc: 'Bookable service, lesson, or cultural experience.',
    color: CultureTokens.teal,
  },
  {
    type: 'link',
    icon: 'open-outline',
    title: 'Link your website',
    desc: 'Drive visitors directly to your own URL.',
    color: CultureTokens.violet,
  },
];

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  type: ShopListingType;
  sellerName: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  priceCents: string;
  isFree: boolean;
  imageUrl: string;
  logoUrl: string;
  externalUrl: string;
  contactEmail: string;
  contactPhone: string;
  isOnline: boolean;
  cultureTags: string[];
  cityTags: string[];
};

const EMPTY: FormState = {
  type: 'product',
  sellerName: '',
  title: '',
  description: '',
  category: '',
  subcategory: '',
  priceCents: '',
  isFree: false,
  imageUrl: '',
  logoUrl: '',
  externalUrl: '',
  contactEmail: '',
  contactPhone: '',
  isOnline: false,
  cultureTags: [],
  cityTags: [],
};

function validate(f: FormState): string | null {
  if (f.title.trim().length < 3) return 'Title must be at least 3 characters.';
  if (f.description.trim().length < 10) return 'Description must be at least 10 characters.';
  if (!f.category) return 'Please select a category.';
  if (f.type === 'link' && !f.externalUrl.trim()) return 'Please enter your website URL.';
  if (f.type === 'link' && !/^https?:\/\//.test(f.externalUrl.trim()))
    return 'Website URL must start with https://';
  return null;
}

// ─── Reusable section title ───────────────────────────────────────────────────

function SectionTitle({ label, sub }: { label: string; sub?: string }) {
  const colors = useColors();
  return (
    <View style={ss.sectionTitle}>
      <Text style={[ss.sectionLabel, { color: colors.text }]}>{label}</Text>
      {sub && <Text style={[ss.sectionSub, { color: colors.textTertiary }]}>{sub}</Text>}
    </View>
  );
}

// ─── Tag chip ─────────────────────────────────────────────────────────────────

function TagChip({
  label,
  active,
  onToggle,
  color,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  color?: string;
}) {
  const colors = useColors();
  const accent = color ?? CultureTokens.violet;
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        ss.tagChip,
        {
          borderColor: active ? accent : colors.borderLight,
          backgroundColor: active ? accent + '1A' : colors.surface,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
    >
      {active && <Ionicons name="checkmark" size={12} color={accent} />}
      <Text style={[ss.tagChipText, { color: active ? accent : colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={ss.field}>
      <Text style={[ss.fieldLabel, { color: colors.text }]}>{label}</Text>
      {children}
      {hint && <Text style={[ss.fieldHint, { color: colors.textTertiary }]}>{hint}</Text>}
    </View>
  );
}

function StyledInput({
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  autoCapitalize,
  maxLength,
}: Partial<React.ComponentProps<typeof TextInput>>) {
  const colors = useColors();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      multiline={multiline}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      maxLength={maxLength}
      style={[
        ss.input,
        multiline && ss.textarea,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          color: colors.text,
        },
      ]}
      textAlignVertical={multiline ? 'top' : undefined}
    />
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

function CreateListingInner({
  variant = 'fullscreen',
  embeddedEditId,
  embeddedInitialType,
  onClose,
  onListingPublished,
}: CultureMarketListingWizardProps = {}) {
  const params = useLocalSearchParams<{ edit?: string; type?: string }>();
  const routeEditId = typeof params.edit === 'string' ? params.edit : undefined;
  const routeTypeParam = typeof params.type === 'string' ? params.type : undefined;

  const editId = variant === 'embedded' ? embeddedEditId ?? undefined : routeEditId;

  const typeFromRoute =
    variant === 'embedded'
      ? embeddedInitialType
      : (['product', 'service', 'link'] as ShopListingType[]).includes(routeTypeParam as ShopListingType)
        ? (routeTypeParam as ShopListingType)
        : undefined;

  const prefilledType = typeFromRoute;

  const isEditing = !!editId;
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const { user } = useAuth();
  const qc = useQueryClient();
  const embedded = variant === 'embedded';

  const [form, setForm] = useState<FormState>(
    prefilledType ? { ...EMPTY, type: prefilledType } : EMPTY,
  );
  const [step, setStep] = useState<'type' | 'form'>(prefilledType ? 'form' : 'type');

  // Pre-fill seller name
  useEffect(() => {
    if (user?.displayName) setForm((f) => ({ ...f, sellerName: f.sellerName || user.displayName! }));
  }, [user?.displayName]);

  // Load existing listing for edit mode
  const editQuery = useQuery({
    queryKey: ['shop-listing', editId],
    queryFn: () => fetchListingWithFallback(editId ?? ''),
    enabled: isEditing,
  });
  useEffect(() => {
    const l = editQuery.data?.listing;
    if (!l) return;
    setForm({
      type: l.type,
      sellerName: l.sellerName ?? '',
      title: l.title,
      description: l.description,
      category: l.category,
      subcategory: l.subcategory ?? '',
      priceCents: l.priceCents ? (l.priceCents / 100).toFixed(2) : '',
      isFree: l.isFree,
      imageUrl: l.imageUrl ?? '',
      logoUrl: l.logoUrl ?? '',
      externalUrl: l.externalUrl ?? '',
      contactEmail: l.contactEmail ?? '',
      contactPhone: l.contactPhone ?? '',
      isOnline: l.isOnline,
      cultureTags: l.cultureTags ?? [],
      cityTags: l.cityTags ?? [],
    });
    setStep('form');
  }, [editQuery.data?.listing]);

  const set = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val })), []);

  const toggleArray = useCallback((key: 'cultureTags' | 'cityTags', val: string) => {
    setForm((f) => {
      const arr = f[key];
      return { ...f, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
    });
  }, []);

  const createMutation = useMutation({
    mutationFn: (payload: CreateShopListingInput & { sellerName: string }) =>
      api.cultureShop.createListing(payload),
    onSuccess: (listing) => {
      void qc.invalidateQueries({ queryKey: ['shop-listings'] });
      void qc.invalidateQueries({ queryKey: ['culture-market-my-listings'] });
      if (embedded) {
        onListingPublished?.(listing);
        return;
      }
      router.replace(`/CultureMarket/${listing.id}` as never);
    },
    onError: () => Alert.alert('Error', 'Failed to create listing. Please try again.'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<CreateShopListingInput>) =>
      api.cultureShop.updateListing(editId!, payload),
    onSuccess: (listing) => {
      void qc.invalidateQueries({ queryKey: ['shop-listings'] });
      void qc.invalidateQueries({ queryKey: ['culture-market-my-listings'] });
      void qc.invalidateQueries({ queryKey: ['shop-listing', editId] });
      if (embedded) {
        onListingPublished?.(listing);
        return;
      }
      router.replace(`/CultureMarket/${listing.id}` as never);
    },
    onError: () => Alert.alert('Error', 'Failed to update listing. Please try again.'),
  });

  const isBusy = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = useCallback(() => {
    const err = validate(form);
    if (err) { Alert.alert('Missing info', err); return; }
    const priceCents = form.isFree ? undefined
      : form.priceCents ? Math.round(parseFloat(form.priceCents) * 100) : undefined;
    const payload = {
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      subcategory: form.subcategory || undefined,
      priceCents,
      isFree: form.isFree,
      imageUrl: form.imageUrl.trim() || undefined,
      logoUrl: form.logoUrl.trim() || undefined,
      externalUrl: form.externalUrl.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      contactPhone: form.contactPhone.trim() || undefined,
      city: form.cityTags[0] || undefined,
      country: user?.country || 'AU',
      isOnline: form.isOnline,
      cultureTags: form.cultureTags,
      cityTags: form.cityTags,
      cultureTag: form.cultureTags[0] || undefined,
      sellerName: form.sellerName.trim() || user?.displayName || 'CultureMarket Seller',
    };
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  }, [form, isEditing, createMutation, updateMutation, user]);

  const pageCol = {
    maxWidth: isDesktop ? 720 : undefined,
    width: '100%' as const,
    alignSelf: isDesktop ? 'center' as const : 'stretch' as const,
  };

  const activeCat = MARKET_CATEGORIES.find((c) => c.id === form.category);
  const typeOpt = TYPE_OPTIONS.find((o) => o.type === form.type) ?? TYPE_OPTIONS[0];

  const typeBg = embedded ? colors.background : '#0F0B1A';
  const typeInk = embedded ? colors.text : '#fff';
  const typeInkMuted = embedded ? colors.textSecondary : 'rgba(255,255,255,0.6)';
  const typeBarPadTop = embedded ? 8 : insets.top + 4;

  // ── Step 1: Choose listing type ──────────────────────────────────────────

  if (step === 'type' && !isEditing) {
    return (
      <View style={[ss.root, { backgroundColor: typeBg }]}>
        {!embedded ? <Stack.Screen options={{ headerShown: false }} /> : null}

        {/* Header */}
        <View
          style={[
            ss.topBar,
            {
              paddingTop: typeBarPadTop,
              paddingHorizontal: hPad,
              backgroundColor: embedded ? colors.surface : HEADER_BG,
            },
          ]}
        >
          <Pressable
            onPress={() => {
              if (embedded) {
                onClose?.();
                return;
              }
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/hostspace/create' as never);
              }
            }}
            style={ss.backBtn}
            accessibilityLabel={embedded ? 'Close listing form' : 'Go back'}
          >
            <Ionicons name="chevron-back" size={24} color={typeInk} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={[ss.topBarTitle, embedded && { color: typeInk }]}>CultureMarket</Text>
            <Text style={[ss.topBarSub, embedded && { color: colors.textTertiary }]}>
              Creation Lab
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          nestedScrollEnabled
          contentContainerStyle={[
            ss.typeScrollContent,
            { paddingHorizontal: hPad, paddingBottom: embedded ? Spacing.xl : insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={pageCol}>
            {/* Hero text */}
            <Animated.View entering={FadeInDown.delay(60).springify()}>
              <View style={ss.typeBadgeRow}>
                <View style={ss.typeBadge}>
                  <Ionicons name="storefront-outline" size={14} color={CultureTokens.coral} />
                  <Text style={ss.typeBadgeText}>3 ways to list</Text>
                </View>
              </View>
              <Text style={[ss.typeHeading, { color: typeInk }]}>How would you{'\n'}like to list?</Text>
              <Text style={[ss.typeSub, { color: typeInkMuted }]}>
                Choose your listing type — you can always change it later from your dashboard.
              </Text>
            </Animated.View>

            {/* Type cards — large, gradient accent, premium */}
            <View style={ss.typeCardsWrap}>
              {TYPE_OPTIONS.map((opt, i) => (
                <Animated.View
                  key={opt.type}
                  entering={FadeInDown.delay(120 + i * 90).springify()}
                >
                  <Pressable
                    onPress={() => { set('type', opt.type); setStep('form'); }}
                    style={({ pressed }) => [
                      ss.typeCardPremium,
                      {
                        opacity: pressed ? 0.88 : 1,
                        borderColor: embedded ? colors.borderLight : 'rgba(255,255,255,0.08)',
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={opt.title}
                  >
                    {/* Gradient background */}
                    <LinearGradient
                      colors={[opt.color + '28', opt.color + '08']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    {/* Left accent bar */}
                    <View style={[ss.typeCardAccentBar, { backgroundColor: opt.color }]} />

                    <View style={ss.typeCardBody}>
                      {/* Icon */}
                      <View style={[ss.typeCardIconWrap, { backgroundColor: opt.color + '22' }]}>
                        <Ionicons name={opt.icon} size={32} color={opt.color} />
                      </View>

                      {/* Text */}
                      <View style={{ flex: 1 }}>
                        <Text style={[ss.typeCardPremiumTitle, embedded && { color: typeInk }]}>
                          {opt.title}
                        </Text>
                        <Text style={[ss.typeCardPremiumDesc, embedded && { color: typeInkMuted }]}>
                          {opt.desc}
                        </Text>
                      </View>

                      {/* Arrow */}
                      <View style={[ss.typeCardArrow, { backgroundColor: opt.color + '22' }]}>
                        <Ionicons name="arrow-forward" size={16} color={opt.color} />
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>

            {/* Deep link note */}
            <Animated.View entering={FadeInDown.delay(440).springify()}>
              <View style={ss.typeLinkNote}>
                <Ionicons
                  name="link-outline"
                  size={16}
                  color={embedded ? colors.textTertiary : 'rgba(255,255,255,0.4)'}
                />
                <Text style={[ss.typeLinkNoteText, embedded && { color: colors.textSecondary }]}>
                  Every listing gets a shareable URL at{' '}
                  <Text style={{ color: CultureTokens.violet }}>culturepass.co/s/[id]</Text>
                </Text>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Step 2: Full form ─────────────────────────────────────────────────────

  const formBarPadTop = embedded ? 8 : insets.top + 4;
  const formInk = embedded ? colors.text : '#fff';

  return (
    <KeyboardAvoidingView
      style={[ss.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {!embedded ? <Stack.Screen options={{ headerShown: false }} /> : null}

      {/* Header */}
      <View
        style={[
          ss.topBar,
          {
            paddingTop: formBarPadTop,
            paddingHorizontal: hPad,
            backgroundColor: embedded ? colors.surface : HEADER_BG,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            if (embedded) {
              if (isEditing) {
                onClose?.();
                return;
              }
              if (prefilledType) {
                onClose?.();
                return;
              }
              setStep('type');
              return;
            }
            if (isEditing) {
              router.back();
              return;
            }
            if (prefilledType) {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/hostspace/create' as never);
              }
              return;
            }
            setStep('type');
          }}
          style={ss.backBtn}
          accessibilityLabel={embedded ? 'Close or go back' : 'Go back'}
        >
          <Ionicons name="chevron-back" size={24} color={formInk} />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={[ss.topBarTitle, embedded && { color: formInk }]}>
            {isEditing ? 'Edit Listing' : typeOpt.title}
          </Text>
          <Text style={[ss.topBarSub, embedded && { color: colors.textTertiary }]}>
            CultureMarket · Creation Lab
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          ss.formContent,
          {
            paddingHorizontal: hPad,
            paddingBottom: embedded ? Spacing.xxl + 40 : insets.bottom + 120,
          },
        ]}
      >
        <View style={pageCol}>
          {/* Type pill */}
          {!isEditing && (
            <Pressable
              onPress={() => setStep('type')}
              style={[ss.typePill, { backgroundColor: typeOpt.color + '1A' }]}
              accessibilityRole="button"
            >
              <Ionicons name={typeOpt.icon} size={14} color={typeOpt.color} />
              <Text style={[ss.typePillText, { color: typeOpt.color }]}>{typeOpt.title}</Text>
              <Ionicons name="pencil-outline" size={12} color={typeOpt.color} />
            </Pressable>
          )}

          {/* ── IDENTITY ─────────────────────────────────────────────────── */}
          <SectionTitle label="Your identity" />
          <Field label="Business / seller name">
            <StyledInput
              value={form.sellerName}
              onChangeText={(v) => set('sellerName', v)}
              placeholder="e.g. Priya Crafts"
              maxLength={120}
            />
          </Field>

          {/* ── LISTING DETAILS ───────────────────────────────────────────── */}
          <SectionTitle label="Listing details" />
          <Field label="Title *">
            <StyledInput
              value={form.title}
              onChangeText={(v) => set('title', v)}
              placeholder={
                form.type === 'link'
                  ? 'e.g. Batik & Wax Print Fabric Store'
                  : form.type === 'service'
                  ? 'e.g. Authentic Kerala Sadya Catering'
                  : 'e.g. Hand-Embroidered Silk Dupatta'
              }
              maxLength={120}
            />
            <Text style={[ss.charCount, { color: colors.textTertiary }]}>{form.title.length}/120</Text>
          </Field>

          <Field label="Description *">
            <StyledInput
              value={form.description}
              onChangeText={(v) => set('description', v)}
              placeholder="Describe your product, service, or business in detail…"
              multiline
              maxLength={2000}
            />
            <Text style={[ss.charCount, { color: colors.textTertiary }]}>{form.description.length}/2000</Text>
          </Field>

          {/* ── CATEGORY ──────────────────────────────────────────────────── */}
          <SectionTitle label="Category" sub="Choose a parent category, then a subcategory" />

          {/* Parent categories */}
          <View style={ss.catGrid}>
            {MARKET_CATEGORIES.map((cat) => {
              const active = form.category === cat.id;
              const accentMap = {
                coral: CultureTokens.coral,
                violet: CultureTokens.violet,
                teal: CultureTokens.teal,
                gold: CultureTokens.gold,
              };
              const accent = accentMap[cat.accentKey];
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    set('category', cat.id);
                    set('subcategory', '');
                  }}
                  style={({ pressed }) => [
                    ss.catChip,
                    {
                      borderColor: active ? accent : colors.borderLight,
                      backgroundColor: active ? accent + '1A' : colors.surface,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={13}
                    color={active ? accent : colors.textTertiary}
                  />
                  <Text style={[ss.catChipText, { color: active ? accent : colors.textSecondary }]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Subcategories */}
          {activeCat && activeCat.subcategories.length > 0 && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <Text style={[ss.subCatLabel, { color: colors.textSecondary }]}>
                {activeCat.label} subcategory
              </Text>
              <View style={ss.catGrid}>
                {activeCat.subcategories.map((sub) => {
                  const active = form.subcategory === sub.id;
                  return (
                    <Pressable
                      key={sub.id}
                      onPress={() => set('subcategory', active ? '' : sub.id)}
                      style={({ pressed }) => [
                        ss.catChip,
                        ss.subCatChip,
                        {
                          borderColor: active ? CultureTokens.teal : colors.borderLight,
                          backgroundColor: active ? CultureTokens.teal + '1A' : colors.surface,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text
                        style={[
                          ss.catChipText,
                          { color: active ? CultureTokens.teal : colors.textSecondary },
                        ]}
                      >
                        {sub.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* ── PRICING ───────────────────────────────────────────────────── */}
          {form.type !== 'link' && (
            <>
              <SectionTitle label="Pricing" />
              <Pressable
                onPress={() => set('isFree', !form.isFree)}
                style={ss.toggleRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: form.isFree }}
              >
                <View
                  style={[
                    ss.checkbox,
                    {
                      borderColor: form.isFree ? CultureTokens.teal : colors.borderLight,
                      backgroundColor: form.isFree ? CultureTokens.teal : 'transparent',
                    },
                  ]}
                >
                  {form.isFree && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[ss.toggleLabel, { color: colors.text }]}>This listing is free</Text>
              </Pressable>
              {!form.isFree && (
                <Field label="Price (AUD)" hint="Enter amount in dollars e.g. 89.00">
                  <StyledInput
                    value={form.priceCents}
                    onChangeText={(v) => set('priceCents', v.replace(/[^0-9.]/g, ''))}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                </Field>
              )}
            </>
          )}

          {/* ── EXTERNAL URL (link type) ──────────────────────────────────── */}
          {form.type === 'link' && (
            <>
              <SectionTitle label="Your website" />
              <Field label="Website URL *" hint="Visitors tap through to this address from your listing.">
                <StyledInput
                  value={form.externalUrl}
                  onChangeText={(v) => set('externalUrl', v)}
                  placeholder="https://yourbusiness.com.au"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </Field>
            </>
          )}

          {/* ── MEDIA ─────────────────────────────────────────────────────── */}
          <SectionTitle label="Images & branding" sub="Optional — add a cover photo and your logo" />
          <Field label="Cover image URL" hint="Landscape photo shown at the top of your listing card.">
            <StyledInput
              value={form.imageUrl}
              onChangeText={(v) => set('imageUrl', v)}
              placeholder="https://yourbusiness.com/cover.jpg"
              keyboardType="url"
              autoCapitalize="none"
            />
          </Field>
          <Field
            label="Brand / logo URL"
            hint="Square logo shown as a white tile over the bottom-right of your card — like the brand logos on UNiDAYS."
          >
            <StyledInput
              value={form.logoUrl}
              onChangeText={(v) => set('logoUrl', v)}
              placeholder="https://yourbusiness.com/logo.png"
              keyboardType="url"
              autoCapitalize="none"
            />
          </Field>

          {/* ── CONTACT ───────────────────────────────────────────────────── */}
          <SectionTitle label="Contact details" sub="Optional — let buyers reach you directly" />
          <Field label="Phone number">
            <StyledInput
              value={form.contactPhone}
              onChangeText={(v) => set('contactPhone', v)}
              placeholder="+61 400 000 000"
              keyboardType="phone-pad"
            />
          </Field>
          <Field label="Email address">
            <StyledInput
              value={form.contactEmail}
              onChangeText={(v) => set('contactEmail', v)}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Field>

          {/* ── CULTURE TAGS ─────────────────────────────────────────────── */}
          <SectionTitle
            label="Culture tags"
            sub="Which communities does this listing serve? Select all that apply."
          />
          <View style={ss.tagGrid}>
            {CULTURE_TAGS.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                active={form.cultureTags.includes(tag)}
                onToggle={() => toggleArray('cultureTags', tag)}
                color={CultureTokens.violet}
              />
            ))}
          </View>

          {/* ── CITY TAGS ────────────────────────────────────────────────── */}
          <SectionTitle
            label="City / location"
            sub="Where is this listing available? Select all that apply."
          />
          <Pressable
            onPress={() => set('isOnline', !form.isOnline)}
            style={ss.toggleRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: form.isOnline }}
          >
            <View
              style={[
                ss.checkbox,
                {
                  borderColor: form.isOnline ? CultureTokens.teal : colors.borderLight,
                  backgroundColor: form.isOnline ? CultureTokens.teal : 'transparent',
                },
              ]}
            >
              {form.isOnline && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={[ss.toggleLabel, { color: colors.text }]}>Online / ships Australia-wide</Text>
          </Pressable>
          <View style={[ss.tagGrid, { marginTop: 10 }]}>
            {CITY_TAGS.map((city) => (
              <TagChip
                key={city}
                label={city}
                active={form.cityTags.includes(city)}
                onToggle={() => toggleArray('cityTags', city)}
                color={CultureTokens.teal}
              />
            ))}
          </View>

          {/* ── DEEP LINK NOTE ───────────────────────────────────────────── */}
          <View style={[ss.deepLinkBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Ionicons name="link-outline" size={18} color={CultureTokens.violet} />
            <View style={{ flex: 1 }}>
              <Text style={[ss.deepLinkTitle, { color: colors.text }]}>
                Your listing gets a shareable deep link
              </Text>
              <Text style={[ss.deepLinkSub, { color: colors.textSecondary }]}>
                Once published:{' '}
                <Text style={{ color: CultureTokens.violet }}>culturepass.co/CultureMarket/[id]</Text>
                {' '}and the short form{' '}
                <Text style={{ color: CultureTokens.violet }}>culturepass.co/s/[id]</Text>
                {' '}— share on social media, in emails, or embed on your site.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Submit bar ────────────────────────────────────────────────────── */}
      <View
        style={[
          ss.submitBar,
          {
            paddingBottom: insets.bottom + 12,
            backgroundColor: colors.surface,
            borderTopColor: colors.borderLight,
          },
        ]}
      >
        <View style={[{ paddingHorizontal: hPad }, pageCol]}>
          <Pressable
            onPress={handleSubmit}
            disabled={isBusy}
            style={({ pressed }) => [ss.submitBtn, { opacity: isBusy || pressed ? 0.8 : 1 }]}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={SignatureGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            {isBusy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name={isEditing ? 'save-outline' : 'rocket-outline'}
                  size={20}
                  color="#fff"
                />
                <Text style={ss.submitBtnText}>
                  {isEditing ? 'Save changes' : 'Publish to CultureMarket'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const HEADER_BG = '#0F0B1A';

const ss = StyleSheet.create({
  root: { flex: 1 },

  // Top bar
  topBar: {
    backgroundColor: HEADER_BG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: '#fff', textAlign: 'center' },
  topBarSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 2,
  },

  // Type step
  typeScrollContent: { paddingTop: Spacing.xl },
  typeBadgeRow: { marginBottom: 16 },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CultureTokens.coral + '22',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: CultureTokens.coral,
    letterSpacing: 0.3,
  },
  typeHeading: {
    fontFamily: FontFamily.bold,
    fontSize: Platform.OS === 'web' ? 38 : 30,
    letterSpacing: -0.6,
    lineHeight: Platform.OS === 'web' ? 46 : 38,
    color: '#fff',
    marginBottom: 12,
  },
  typeSub: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 32,
  },
  typeCardsWrap: { gap: 14, marginBottom: 28 },

  // Premium type card
  typeCardPremium: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  typeCardAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  typeCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    paddingLeft: 22,
  },
  typeCardIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  typeCardPremiumTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: '#fff',
    marginBottom: 5,
  },
  typeCardPremiumDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.62)',
  },
  typeCardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  typeLinkNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 4,
  },
  typeLinkNoteText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.38)',
    flex: 1,
  },

  // Legacy — keep for infoBox
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 2,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  typeIconBox: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeCardTitle: { fontFamily: FontFamily.bold, fontSize: 16, marginBottom: 3 },
  typeCardDesc: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 19 },

  infoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 8,
  },
  infoBoxText: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 19, flex: 1 },

  // Form step
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  typePillText: { fontFamily: FontFamily.semibold, fontSize: 13 },

  formContent: { paddingTop: Spacing.sm },

  // Section
  sectionTitle: { marginTop: Spacing.xl, marginBottom: Spacing.md },
  sectionLabel: { fontFamily: FontFamily.bold, fontSize: 16, letterSpacing: -0.2 },
  sectionSub: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, marginTop: 3 },

  // Fields
  field: { marginBottom: Spacing.md },
  fieldLabel: { fontFamily: FontFamily.semibold, fontSize: 14, marginBottom: 8 },
  fieldHint: { fontFamily: FontFamily.regular, fontSize: 12, marginTop: 5, lineHeight: 17 },
  input: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    fontFamily: FontFamily.regular,
    fontSize: 15,
  },
  textarea: { height: 120, paddingTop: 12, paddingBottom: 12 },
  charCount: { fontFamily: FontFamily.regular, fontSize: 12, marginTop: 4, textAlign: 'right' },

  // Categories
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 2,
  },
  catChipText: { fontFamily: FontFamily.semibold, fontSize: 12 },
  subCatLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    marginTop: Spacing.md,
    marginBottom: 8,
  },
  subCatChip: {
    borderWidth: 1,
  },

  // Toggles
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: { fontFamily: FontFamily.regular, fontSize: 15, flex: 1 },

  // Tags
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  tagChipText: { fontFamily: FontFamily.semibold, fontSize: 12 },

  // Deep link
  deepLinkBox: {
    flexDirection: 'row',
    gap: 12,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.xl,
  },
  deepLinkTitle: { fontFamily: FontFamily.semibold, fontSize: 14, marginBottom: 5 },
  deepLinkSub: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 19 },

  // Submit
  submitBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  submitBtn: {
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 10,
  },
  submitBtnText: { fontFamily: FontFamily.semibold, fontSize: 16, color: '#fff' },
});

export function CultureMarketListingWizard(props: CultureMarketListingWizardProps = {}) {
  return (
    <ErrorBoundary
      onError={(error, stackTrace) => {
        if (__DEV__) console.error('CultureMarket listing wizard', error, stackTrace);
      }}
    >
      <CreateListingInner {...props} />
    </ErrorBoundary>
  );
}
