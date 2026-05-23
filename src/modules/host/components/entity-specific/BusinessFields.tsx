/**
 * BusinessFields Component
 *
 * Entity-specific fields for the "business" entity type.
 * Renders within the wizard flow to collect business-specific data:
 * - Product/Service Catalogue (up to 20 items)
 * - Price Range selector ($–$$$$)
 * - Payment Methods multi-select
 * - Business Hours (weekly recurring schedule)
 * - Holiday Calendar (exception dates)
 * - Partner Network linking
 * - Business Category selection
 *
 * Requirements: 15 (Business-Specific Fields)
 *
 * Design System Usage:
 * - M3Card for section containers
 * - Input for text/number fields
 * - Button for actions
 * - Checkbox for multi-select options
 * - CultureTokens for brand colors
 * - Radius, Spacing, TextStyles for layout
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { M3Card } from '@/design-system/ui/M3Card';
import { Input } from '@/design-system/ui/Input';
import { Button } from '@/design-system/ui/Button';
import { Checkbox } from '@/design-system/ui/Checkbox';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, Radius, Spacing, TextStyles } from '@/design-system/tokens/theme';
import type { WizardStepProps } from '../FormWizard/WizardStep';
import type {
  BusinessData,
  CatalogueItem,
  ExceptionDate,
  RecurringSchedule,
  PaymentMethod,
} from '@shared/schema/hostProfile';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CATALOGUE_ITEMS = 20;

const PRICE_RANGE_OPTIONS: { value: BusinessData['priceRange']; label: string; icon: string }[] = [
  { value: 'budget', label: 'Budget', icon: '$' },
  { value: 'moderate', label: 'Moderate', icon: '$$' },
  { value: 'premium', label: 'Premium', icon: '$$$' },
  { value: 'luxury', label: 'Luxury', icon: '$$$$' },
];

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'cash', label: 'Cash', icon: 'cash-outline' },
  { value: 'card', label: 'Card', icon: 'card-outline' },
  { value: 'digital-wallet', label: 'Digital Wallet', icon: 'phone-portrait-outline' },
  { value: 'bank-transfer', label: 'Bank Transfer', icon: 'swap-horizontal-outline' },
  { value: 'crypto', label: 'Crypto', icon: 'logo-bitcoin' },
];

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

/** Predefined business categories for the taxonomy selector */
const BUSINESS_CATEGORIES = [
  'Food & Beverage',
  'Retail & Shopping',
  'Health & Wellness',
  'Beauty & Personal Care',
  'Arts & Crafts',
  'Education & Training',
  'Entertainment & Leisure',
  'Professional Services',
  'Technology & Digital',
  'Home & Garden',
  'Automotive',
  'Travel & Tourism',
  'Fashion & Apparel',
  'Sports & Fitness',
  'Media & Publishing',
  'Finance & Insurance',
  'Real Estate',
  'Non-Profit & Community',
  'Other',
];

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

/**
 * Single catalogue item editor row
 */
function CatalogueItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  colors,
}: {
  item: CatalogueItem;
  index: number;
  onUpdate: (index: number, field: keyof CatalogueItem, value: string | number) => void;
  onRemove: (index: number) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <M3Card style={[catalogueStyles.itemCard, { borderColor: colors.borderLight }]}>
      <View style={catalogueStyles.itemHeader}>
        <Text style={[catalogueStyles.itemNumber, { color: colors.textSecondary }]}>
          #{index + 1}
        </Text>
        <Pressable
          onPress={() => onRemove(index)}
          hitSlop={12}
          accessibilityLabel={`Remove item ${index + 1}`}
          accessibilityRole="button"
        >
          <Ionicons name="close-circle" size={22} color={CultureTokens.coral} />
        </Pressable>
      </View>

      <Input
        label="Name"
        value={item.name}
        onChangeText={(text) => onUpdate(index, 'name', text)}
        placeholder="Product or service name"
        accessibilityLabel={`Item ${index + 1} name`}
      />
      <Input
        label="Description"
        value={item.description}
        onChangeText={(text) => onUpdate(index, 'description', text)}
        placeholder="Brief description"
        multiline
        numberOfLines={2}
        accessibilityLabel={`Item ${index + 1} description`}
      />
      <Input
        label="Price (cents)"
        value={item.price > 0 ? String(item.price) : ''}
        onChangeText={(text) => onUpdate(index, 'price', parseInt(text, 10) || 0)}
        placeholder="e.g. 2500 for $25.00"
        keyboardType="numeric"
        accessibilityLabel={`Item ${index + 1} price in cents`}
      />
    </M3Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * BusinessFields — entity-specific fields for the "business" entity type.
 *
 * Renders within the wizard (typically Step 4 or a dedicated entity step)
 * and manages the `businessData` slice of the form state.
 */
export default function BusinessFields({
  formData,
  updateFormData,
  getFieldError,
}: WizardStepProps) {
  const colors = useColors();
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // ---------------------------------------------------------------------------
  // Derived State
  // ---------------------------------------------------------------------------

  const businessData: Partial<BusinessData> = useMemo(() => {
    return (formData.businessData as Partial<BusinessData>) || {};
  }, [formData.businessData]);

  const catalogue: CatalogueItem[] = useMemo(() => {
    return businessData.catalogue || [];
  }, [businessData.catalogue]);

  const paymentMethods: PaymentMethod[] = useMemo(() => {
    return businessData.paymentMethods || [];
  }, [businessData.paymentMethods]);

  const businessHours: Partial<RecurringSchedule> = useMemo(() => {
    return businessData.businessHours || {};
  }, [businessData.businessHours]);

  const holidayCalendar: ExceptionDate[] = useMemo(() => {
    return businessData.holidayCalendar || [];
  }, [businessData.holidayCalendar]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Persist updated businessData to the wizard form state */
  const updateBusinessData = useCallback(
    (patch: Partial<BusinessData>) => {
      updateFormData({
        businessData: {
          ...businessData,
          ...patch,
        } as any,
      });
    },
    [businessData, updateFormData]
  );

  // ---------------------------------------------------------------------------
  // Catalogue Handlers
  // ---------------------------------------------------------------------------

  const handleAddCatalogueItem = useCallback(() => {
    if (catalogue.length >= MAX_CATALOGUE_ITEMS) return;
    const newItem: CatalogueItem = { name: '', description: '', price: 0 };
    updateBusinessData({ catalogue: [...catalogue, newItem] });
  }, [catalogue, updateBusinessData]);

  const handleUpdateCatalogueItem = useCallback(
    (index: number, field: keyof CatalogueItem, value: string | number) => {
      const updated = [...catalogue];
      updated[index] = { ...updated[index], [field]: value };
      updateBusinessData({ catalogue: updated });
    },
    [catalogue, updateBusinessData]
  );

  const handleRemoveCatalogueItem = useCallback(
    (index: number) => {
      const updated = catalogue.filter((_, i) => i !== index);
      updateBusinessData({ catalogue: updated });
    },
    [catalogue, updateBusinessData]
  );

  // ---------------------------------------------------------------------------
  // Price Range Handler
  // ---------------------------------------------------------------------------

  const handlePriceRangeSelect = useCallback(
    (value: BusinessData['priceRange']) => {
      updateBusinessData({ priceRange: value });
    },
    [updateBusinessData]
  );

  // ---------------------------------------------------------------------------
  // Payment Methods Handler
  // ---------------------------------------------------------------------------

  const handleTogglePaymentMethod = useCallback(
    (method: PaymentMethod) => {
      const updated = paymentMethods.includes(method)
        ? paymentMethods.filter((m) => m !== method)
        : [...paymentMethods, method];
      updateBusinessData({ paymentMethods: updated });
    },
    [paymentMethods, updateBusinessData]
  );

  // ---------------------------------------------------------------------------
  // Business Hours Handlers
  // ---------------------------------------------------------------------------

  const handleUpdateHours = useCallback(
    (day: keyof RecurringSchedule, field: 'open' | 'close', value: string) => {
      const currentDay = businessHours[day] || { open: '09:00', close: '17:00' };
      updateBusinessData({
        businessHours: {
          ...businessHours,
          [day]: { ...currentDay, [field]: value },
        } as RecurringSchedule,
      });
    },
    [businessHours, updateBusinessData]
  );

  const handleToggleDay = useCallback(
    (day: keyof RecurringSchedule) => {
      if (businessHours[day]) {
        // Remove the day (closed)
        const updated = { ...businessHours };
        delete updated[day];
        updateBusinessData({ businessHours: updated as RecurringSchedule });
      } else {
        // Add the day with defaults
        updateBusinessData({
          businessHours: {
            ...businessHours,
            [day]: { open: '09:00', close: '17:00' },
          } as RecurringSchedule,
        });
      }
    },
    [businessHours, updateBusinessData]
  );

  // ---------------------------------------------------------------------------
  // Holiday Calendar Handlers
  // ---------------------------------------------------------------------------

  const handleAddHoliday = useCallback(() => {
    const newHoliday: ExceptionDate = {
      date: new Date().toISOString().split('T')[0],
      reason: '',
      closed: true,
    };
    updateBusinessData({ holidayCalendar: [...holidayCalendar, newHoliday] });
  }, [holidayCalendar, updateBusinessData]);

  const handleUpdateHoliday = useCallback(
    (index: number, field: keyof ExceptionDate, value: string | boolean) => {
      const updated = [...holidayCalendar];
      updated[index] = { ...updated[index], [field]: value };
      updateBusinessData({ holidayCalendar: updated });
    },
    [holidayCalendar, updateBusinessData]
  );

  const handleRemoveHoliday = useCallback(
    (index: number) => {
      const updated = holidayCalendar.filter((_, i) => i !== index);
      updateBusinessData({ holidayCalendar: updated });
    },
    [holidayCalendar, updateBusinessData]
  );

  // ---------------------------------------------------------------------------
  // Partner Network Handler
  // ---------------------------------------------------------------------------

  const handleUpdatePartners = useCallback(
    (text: string) => {
      // Partners stored as comma-separated profile IDs
      const ids = text
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      updateBusinessData({ partners: ids });
    },
    [updateBusinessData]
  );

  // ---------------------------------------------------------------------------
  // Category Handler
  // ---------------------------------------------------------------------------

  const handleSelectCategory = useCallback(
    (category: string) => {
      updateBusinessData({ category });
      setShowCategoryPicker(false);
    },
    [updateBusinessData]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${CultureTokens.teal}15` }]}>
          <Ionicons name="storefront" size={28} color={CultureTokens.teal} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>
            Business Details
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Showcase your products, services, and operating information
          </Text>
        </View>
      </View>

      {/* ================================================================== */}
      {/* Business Category */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Business Category
          </Text>
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>Required</Text>
          </View>
        </View>

        <Pressable
          onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          accessibilityRole="button"
          accessibilityLabel="Select business category"
          style={[
            styles.categorySelector,
            {
              borderColor: businessData.category ? CultureTokens.teal : colors.borderLight,
              backgroundColor: colors.card,
            },
          ]}
        >
          <Ionicons
            name="grid-outline"
            size={20}
            color={businessData.category ? CultureTokens.teal : colors.textSecondary}
          />
          <Text
            style={[
              styles.categorySelectorText,
              {
                color: businessData.category ? colors.text : colors.textSecondary,
              },
            ]}
          >
            {businessData.category || 'Select a category'}
          </Text>
          <Ionicons
            name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>

        {showCategoryPicker && (
          <M3Card style={[styles.categoryList, { borderColor: colors.borderLight }]}>
            <ScrollView
              style={styles.categoryScroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {BUSINESS_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => handleSelectCategory(cat)}
                  accessibilityRole="menuitem"
                  accessibilityLabel={cat}
                  style={[
                    styles.categoryOption,
                    businessData.category === cat && {
                      backgroundColor: `${CultureTokens.teal}15`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      {
                        color: businessData.category === cat
                          ? CultureTokens.teal
                          : colors.text,
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                  {businessData.category === cat && (
                    <Ionicons name="checkmark" size={18} color={CultureTokens.teal} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </M3Card>
        )}

        {getFieldError('businessData.category') && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {getFieldError('businessData.category')}
          </Text>
        )}
      </View>

      {/* ================================================================== */}
      {/* Price Range */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Price Range
          </Text>
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>Required</Text>
          </View>
        </View>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Indicate the general pricing tier for your products or services
        </Text>

        <View style={styles.priceRangeRow}>
          {PRICE_RANGE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => handlePriceRangeSelect(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: businessData.priceRange === option.value }}
              accessibilityLabel={`${option.label} price range`}
              style={[
                styles.priceRangeOption,
                {
                  borderColor:
                    businessData.priceRange === option.value
                      ? CultureTokens.teal
                      : colors.borderLight,
                  backgroundColor:
                    businessData.priceRange === option.value
                      ? `${CultureTokens.teal}12`
                      : colors.card,
                },
              ]}
            >
              <Text
                style={[
                  styles.priceRangeIcon,
                  {
                    color:
                      businessData.priceRange === option.value
                        ? CultureTokens.teal
                        : colors.textSecondary,
                  },
                ]}
              >
                {option.icon}
              </Text>
              <Text
                style={[
                  styles.priceRangeLabel,
                  {
                    color:
                      businessData.priceRange === option.value
                        ? CultureTokens.teal
                        : colors.text,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {getFieldError('businessData.priceRange') && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {getFieldError('businessData.priceRange')}
          </Text>
        )}
      </View>

      {/* ================================================================== */}
      {/* Payment Methods */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Accepted Payment Methods
          </Text>
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>Required</Text>
          </View>
        </View>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Select all payment methods your business accepts
        </Text>

        <View style={styles.paymentGrid}>
          {PAYMENT_METHOD_OPTIONS.map((option) => {
            const isSelected = paymentMethods.includes(option.value);
            return (
              <Pressable
                key={option.value}
                onPress={() => handleTogglePaymentMethod(option.value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${option.label} payment method`}
                style={[
                  styles.paymentOption,
                  {
                    borderColor: isSelected ? CultureTokens.indigo : colors.borderLight,
                    backgroundColor: isSelected ? `${CultureTokens.indigo}10` : colors.card,
                  },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={22}
                  color={isSelected ? CultureTokens.indigo : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.paymentLabel,
                    { color: isSelected ? CultureTokens.indigo : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <View style={styles.paymentCheck}>
                    <Ionicons name="checkmark-circle" size={18} color={CultureTokens.indigo} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {getFieldError('businessData.paymentMethods') && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {getFieldError('businessData.paymentMethods')}
          </Text>
        )}
      </View>

      {/* ================================================================== */}
      {/* Business Hours */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Business Hours
          </Text>
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>Required</Text>
          </View>
        </View>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Set your regular operating hours for each day of the week
        </Text>

        <View style={styles.hoursContainer}>
          {DAYS_OF_WEEK.map((day) => {
            const isOpen = !!businessHours[day];
            const hours = businessHours[day];
            return (
              <View
                key={day}
                style={[
                  styles.dayRow,
                  { borderBottomColor: colors.borderLight },
                ]}
              >
                <View style={styles.dayToggle}>
                  <Checkbox
                    checked={isOpen}
                    onToggle={(_checked: boolean) => handleToggleDay(day)}
                  />
                  <Text
                    style={[
                      styles.dayLabel,
                      { color: isOpen ? colors.text : colors.textSecondary },
                    ]}
                  >
                    {DAY_LABELS[day]}
                  </Text>
                </View>

                {isOpen && hours ? (
                  <View style={styles.timeInputs}>
                    <Input
                      value={hours.open}
                      onChangeText={(v) => handleUpdateHours(day, 'open', v)}
                      placeholder="09:00"
                      containerStyle={styles.timeInput}
                      accessibilityLabel={`${DAY_LABELS[day]} opening time`}
                    />
                    <Text style={[styles.timeSeparator, { color: colors.textSecondary }]}>
                      –
                    </Text>
                    <Input
                      value={hours.close}
                      onChangeText={(v) => handleUpdateHours(day, 'close', v)}
                      placeholder="17:00"
                      containerStyle={styles.timeInput}
                      accessibilityLabel={`${DAY_LABELS[day]} closing time`}
                    />
                  </View>
                ) : (
                  <Text style={[styles.closedLabel, { color: colors.textTertiary }]}>
                    Closed
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {getFieldError('businessData.businessHours') && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {getFieldError('businessData.businessHours')}
          </Text>
        )}
      </View>

      {/* ================================================================== */}
      {/* Holiday Calendar */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Holiday Calendar
          </Text>
          <View style={[styles.optionalBadge, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.optionalText, { color: colors.textSecondary }]}>
              Optional
            </Text>
          </View>
        </View>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Add dates when your business will be closed for holidays or special occasions
        </Text>

        {holidayCalendar.map((holiday, index) => (
          <M3Card
            key={`holiday-${index}`}
            style={[styles.holidayCard, { borderColor: colors.borderLight }]}
          >
            <View style={styles.holidayHeader}>
              <Ionicons name="calendar-outline" size={18} color={CultureTokens.coral} />
              <Pressable
                onPress={() => handleRemoveHoliday(index)}
                hitSlop={12}
                accessibilityLabel={`Remove holiday ${index + 1}`}
                accessibilityRole="button"
              >
                <Ionicons name="close-circle" size={20} color={CultureTokens.coral} />
              </Pressable>
            </View>
            <Input
              label="Date (YYYY-MM-DD)"
              value={holiday.date}
              onChangeText={(v) => handleUpdateHoliday(index, 'date', v)}
              placeholder="2025-12-25"
              accessibilityLabel={`Holiday ${index + 1} date`}
            />
            <Input
              label="Reason"
              value={holiday.reason}
              onChangeText={(v) => handleUpdateHoliday(index, 'reason', v)}
              placeholder="e.g. Christmas Day"
              accessibilityLabel={`Holiday ${index + 1} reason`}
            />
          </M3Card>
        ))}

        <Button
          variant="outline"
          size="sm"
          leftIcon="add-circle-outline"
          onPress={handleAddHoliday}
          style={styles.addButton}
        >
          Add Holiday
        </Button>
      </View>

      {/* ================================================================== */}
      {/* Product/Service Catalogue */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Product/Service Catalogue
          </Text>
          <View style={[styles.optionalBadge, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.optionalText, { color: colors.textSecondary }]}>
              Optional
            </Text>
          </View>
        </View>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Add up to {MAX_CATALOGUE_ITEMS} products or services to showcase what you offer
        </Text>

        {/* Item count indicator */}
        <View style={styles.catalogueCount}>
          <Text style={[styles.catalogueCountText, { color: colors.textSecondary }]}>
            {catalogue.length} / {MAX_CATALOGUE_ITEMS} items
          </Text>
        </View>

        {catalogue.map((item, index) => (
          <CatalogueItemRow
            key={`catalogue-${index}`}
            item={item}
            index={index}
            onUpdate={handleUpdateCatalogueItem}
            onRemove={handleRemoveCatalogueItem}
            colors={colors}
          />
        ))}

        {catalogue.length < MAX_CATALOGUE_ITEMS && (
          <Button
            variant="outline"
            size="sm"
            leftIcon="add-circle-outline"
            onPress={handleAddCatalogueItem}
            style={styles.addButton}
          >
            Add Item
          </Button>
        )}

        {getFieldError('businessData.catalogue') && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {getFieldError('businessData.catalogue')}
          </Text>
        )}
      </View>

      {/* ================================================================== */}
      {/* Partner Network */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Partner Network
          </Text>
          <View style={[styles.optionalBadge, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.optionalText, { color: colors.textSecondary }]}>
              Optional
            </Text>
          </View>
        </View>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Link to other CulturePass business profiles you partner with
        </Text>

        <Input
          label="Partner Profile IDs"
          value={(businessData.partners || []).join(', ')}
          onChangeText={handleUpdatePartners}
          placeholder="Enter profile IDs separated by commas"
          hint="Partner logos will be displayed on your business profile page"
          accessibilityLabel="Partner profile IDs"
        />
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...TextStyles.title2,
    fontSize: 24,
  },
  subtitle: {
    ...TextStyles.body,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  sectionDescription: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 19,
    marginTop: -4,
  },
  requiredBadge: {
    backgroundColor: CultureTokens.coral,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  requiredText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  optionalText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 4,
  },
  // Category Selector
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    minHeight: 48,
  },
  categorySelectorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  categoryList: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  categoryScroll: {
    maxHeight: 240,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  categoryOptionText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  // Price Range
  priceRangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  priceRangeOption: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    gap: 4,
  },
  priceRangeIcon: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  priceRangeLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  // Payment Methods
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    minWidth: 130,
  },
  paymentLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
  paymentCheck: {
    marginLeft: 'auto',
  },
  // Business Hours
  hoursContainer: {
    gap: 0,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minWidth: 80,
  },
  dayLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeInput: {
    width: 80,
  },
  timeSeparator: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },
  closedLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    fontStyle: 'italic',
  },
  // Holiday Calendar
  holidayCard: {
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.sm,
    gap: Spacing.sm,
  },
  holidayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    alignSelf: 'flex-start',
  },
  // Catalogue
  catalogueCount: {
    alignSelf: 'flex-end',
  },
  catalogueCountText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});

/** Styles for the CatalogueItemRow sub-component */
const catalogueStyles = StyleSheet.create({
  itemCard: {
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.sm,
    gap: Spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemNumber: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
});
