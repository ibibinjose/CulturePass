/**
 * ArtistFields Component
 *
 * Entity-specific fields for the "artist" entity type in the HostSpace
 * Enterprise-Grade Form System. Collects portfolio, genres/mediums,
 * representation/agent details, availability calendar, and booking lead time.
 *
 * Features:
 * - Portfolio section (images + video embeds, drag-to-reorder via move up/down)
 * - Genres/mediums multi-select chip grid with AI recommendation
 * - Representation/agent details (name, email, phone)
 * - Availability calendar (monthly view with date status toggles)
 * - Booking lead time selector (1, 3, 7, 14, 30, 60, 90 days)
 * - Mobile-responsive (320px+)
 * - WCAG 2.1 Level AA compliant
 *
 * Requirements: 16
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import {
  CultureTokens,
  Spacing,
  Radius,
  FontFamily,
  ButtonTokens,
  InputTokens,
} from '@/design-system/tokens/theme';
import type { ArtistData, PortfolioItem } from '@/shared/schema/hostProfile';
import type { PartialFormData } from '../../services/formStateSerializer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ArtistFieldsProps {
  /** Current form data */
  formData: PartialFormData;
  /** Update form data callback */
  updateFormData: (data: Partial<PartialFormData>) => void;
  /** Get field error helper */
  getFieldError: (field: string) => string | undefined;
}

type AvailabilityStatus = 'available' | 'booked' | 'unavailable';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Predefined genres/mediums for artist profiles */
const GENRE_OPTIONS = [
  'Visual Arts',
  'Painting',
  'Sculpture',
  'Photography',
  'Digital Art',
  'Mixed Media',
  'Illustration',
  'Printmaking',
  'Ceramics',
  'Textile Art',
  'Street Art',
  'Performance Art',
  'Dance',
  'Music',
  'Theatre',
  'Film',
  'Animation',
  'Installation',
  'Conceptual Art',
  'Folk Art',
  'Indigenous Art',
  'Calligraphy',
  'Graffiti',
  'Glass Art',
  'Woodwork',
  'Metalwork',
  'Jewellery',
  'Fashion Design',
  'Spoken Word',
  'Poetry',
  'Comedy',
  'Circus Arts',
  'DJ / Electronic',
  'Hip Hop',
  'R&B / Soul',
  'Jazz',
  'Classical',
  'World Music',
  'Rock / Indie',
  'Pop',
  'Reggae / Dancehall',
  'Afrobeats',
  'Bollywood',
  'Latin',
  'Country',
  'Blues',
  'Gospel',
  'Experimental',
] as const;

/** Booking lead time options (days) */
const LEAD_TIME_OPTIONS = [1, 3, 7, 14, 30, 60, 90] as const;

/** Days of the week for calendar header */
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ---------------------------------------------------------------------------
// Calendar Utilities
// ---------------------------------------------------------------------------

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // ISO week: Mon=0, Sun=6
}

function formatDateISO(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ArtistFields({
  formData,
  updateFormData,
  getFieldError,
}: ArtistFieldsProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();

  // Local state
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [genreSearch, setGenreSearch] = useState('');

  // ---------------------------------------------------------------------------
  // Data Accessors
  // ---------------------------------------------------------------------------

  const artistData = useMemo<Partial<ArtistData>>(() => formData.artistData || {
    portfolio: [],
    genres: [],
    availabilityCalendar: [],
    bookingLeadTime: 7,
  }, [formData.artistData]);

  const portfolio = useMemo(() => artistData.portfolio || [], [artistData.portfolio]);
  const genres = useMemo(() => artistData.genres || [], [artistData.genres]);
  const representation = artistData.representation;
  const availabilityCalendar = useMemo(() => artistData.availabilityCalendar || [], [artistData.availabilityCalendar]);
  const bookingLeadTime = artistData.bookingLeadTime ?? 7;

  // ---------------------------------------------------------------------------
  // Update Helper
  // ---------------------------------------------------------------------------

  const updateArtistData = useCallback(
    (updates: Partial<ArtistData>) => {
      updateFormData({
        artistData: {
          ...artistData,
          ...updates,
        } as ArtistData,
      });
    },
    [artistData, updateFormData]
  );

  // ---------------------------------------------------------------------------
  // Portfolio Handlers
  // ---------------------------------------------------------------------------

  const handleRemovePortfolioItem = useCallback(
    (index: number) => {
      const updated = portfolio
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, order: i }));
      updateArtistData({ portfolio: updated });
    },
    [portfolio, updateArtistData]
  );

  const handleMovePortfolioItem = useCallback(
    (fromIndex: number, direction: 'up' | 'down') => {
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= portfolio.length) return;
      const updated = [...portfolio];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      updateArtistData({
        portfolio: updated.map((item, i) => ({ ...item, order: i })),
      });
    },
    [portfolio, updateArtistData]
  );

  const handleAddVideoEmbed = useCallback(() => {
    const trimmed = videoUrl.trim();
    if (!trimmed) return;
    const newItem: PortfolioItem = {
      type: 'video',
      url: trimmed,
      order: portfolio.length,
    };
    updateArtistData({ portfolio: [...portfolio, newItem] });
    setVideoUrl('');
  }, [videoUrl, portfolio, updateArtistData]);

  const handleAddImage = useCallback(() => {
    // Placeholder: In production, this opens the image picker / upload flow
    // For now, we simulate adding a placeholder image URL
    const newItem: PortfolioItem = {
      type: 'image',
      url: `https://placeholder.culturepass.co/portfolio-${portfolio.length + 1}.jpg`,
      order: portfolio.length,
    };
    updateArtistData({ portfolio: [...portfolio, newItem] });
  }, [portfolio, updateArtistData]);

  const handleCaptionChange = useCallback(
    (index: number, caption: string) => {
      const updated = portfolio.map((item, i) =>
        i === index ? { ...item, caption } : item
      );
      updateArtistData({ portfolio: updated });
    },
    [portfolio, updateArtistData]
  );

  // ---------------------------------------------------------------------------
  // Genre/Medium Handlers
  // ---------------------------------------------------------------------------

  const filteredGenres = useMemo(() => {
    if (!genreSearch.trim()) return GENRE_OPTIONS;
    const query = genreSearch.toLowerCase();
    return GENRE_OPTIONS.filter((g) => g.toLowerCase().includes(query));
  }, [genreSearch]);

  const handleToggleGenre = useCallback(
    (genre: string) => {
      const updated = genres.includes(genre)
        ? genres.filter((g) => g !== genre)
        : [...genres, genre];
      updateArtistData({ genres: updated });
    },
    [genres, updateArtistData]
  );

  const handleAIRecommendGenres = useCallback(async () => {
    if (portfolio.length === 0) return;
    setIsLoadingAI(true);
    try {
      // Simulate AI recommendation based on portfolio content
      // In production, calls api.ai.recommendGenres({ portfolioUrls })
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const recommendations = ['Visual Arts', 'Mixed Media', 'Photography'].filter(
        (g) => !genres.includes(g)
      );
      if (recommendations.length > 0) {
        updateArtistData({ genres: [...genres, ...recommendations] });
      }
    } catch {
      // AI recommendations are non-critical — fail silently
    } finally {
      setIsLoadingAI(false);
    }
  }, [portfolio, genres, updateArtistData]);

  // ---------------------------------------------------------------------------
  // Representation Handlers
  // ---------------------------------------------------------------------------

  const handleRepresentationChange = useCallback(
    (field: 'name' | 'email' | 'phone', value: string) => {
      updateArtistData({
        representation: {
          name: representation?.name ?? '',
          email: representation?.email ?? '',
          phone: representation?.phone ?? '',
          [field]: value,
        },
      });
    },
    [representation, updateArtistData]
  );

  // ---------------------------------------------------------------------------
  // Calendar Handlers
  // ---------------------------------------------------------------------------

  const handlePrevMonth = useCallback(() => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  }, [calendarMonth]);

  const handleNextMonth = useCallback(() => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  }, [calendarMonth]);

  const getDateStatus = useCallback(
    (dateStr: string): AvailabilityStatus | undefined => {
      const entry = availabilityCalendar.find((d) => d.date === dateStr);
      return entry?.status;
    },
    [availabilityCalendar]
  );

  const handleDatePress = useCallback(
    (dateStr: string) => {
      const existing = availabilityCalendar.find((d) => d.date === dateStr);
      let newStatus: AvailabilityStatus;

      if (!existing) {
        newStatus = 'available';
      } else if (existing.status === 'available') {
        newStatus = 'unavailable';
      } else if (existing.status === 'unavailable') {
        newStatus = 'booked';
      } else {
        // Cycle back to unset (remove entry)
        const updated = availabilityCalendar.filter((d) => d.date !== dateStr);
        updateArtistData({ availabilityCalendar: updated });
        return;
      }

      const updated = availabilityCalendar.filter((d) => d.date !== dateStr);
      updated.push({ date: dateStr, status: newStatus });
      updateArtistData({ availabilityCalendar: updated });
    },
    [availabilityCalendar, updateArtistData]
  );

  // ---------------------------------------------------------------------------
  // Calendar Grid Computation
  // ---------------------------------------------------------------------------

  const calendarGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
    const cells: ({ day: number; dateStr: string } | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, dateStr: formatDateISO(calendarYear, calendarMonth, d) });
    }
    return cells;
  }, [calendarYear, calendarMonth]);

  const monthLabel = useMemo(() => {
    const date = new Date(calendarYear, calendarMonth);
    return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
  }, [calendarYear, calendarMonth]);

  // ---------------------------------------------------------------------------
  // Status color helper
  // ---------------------------------------------------------------------------

  const getStatusColor = (status?: AvailabilityStatus): string => {
    switch (status) {
      case 'available':
        return CultureTokens.teal;
      case 'booked':
        return CultureTokens.coral;
      case 'unavailable':
        return '#9CA3AF'; // neutral gray
      default:
        return 'transparent';
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        isDesktop && styles.contentDesktop,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name="color-palette-outline" size={28} color={CultureTokens.violet} />
        </View>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          Artist Details
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Showcase your portfolio, genres, and availability to attract bookings.
        </Text>
      </View>

      {/* ================================================================== */}
      {/* Section 1: Portfolio */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">
          Portfolio
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Add 3–20 work samples. Drag to reorder using the arrow buttons.
        </Text>

        {/* Portfolio items list */}
        {portfolio.length > 0 && (
          <View style={styles.portfolioList}>
            {portfolio.map((item, index) => (
              <View
                key={`portfolio-${index}`}
                style={[styles.portfolioItem, { backgroundColor: colors.surfaceElevated }]}
              >
                <View style={styles.portfolioItemHeader}>
                  <View style={styles.portfolioItemInfo}>
                    <Ionicons
                      name={item.type === 'video' ? 'videocam-outline' : 'image-outline'}
                      size={20}
                      color={item.type === 'video' ? CultureTokens.coral : CultureTokens.indigo}
                    />
                    <Text style={[styles.portfolioItemType, { color: colors.text }]} numberOfLines={1}>
                      {item.type === 'video' ? 'Video' : 'Image'} #{index + 1}
                    </Text>
                  </View>
                  <View style={styles.portfolioItemActions}>
                    <Pressable
                      onPress={() => handleMovePortfolioItem(index, 'up')}
                      disabled={index === 0}
                      accessibilityLabel={`Move item ${index + 1} up`}
                      accessibilityRole="button"
                      hitSlop={8}
                      style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                    >
                      <Ionicons name="arrow-up" size={16} color={index === 0 ? colors.textSecondary : CultureTokens.indigo} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleMovePortfolioItem(index, 'down')}
                      disabled={index === portfolio.length - 1}
                      accessibilityLabel={`Move item ${index + 1} down`}
                      accessibilityRole="button"
                      hitSlop={8}
                      style={[styles.reorderButton, index === portfolio.length - 1 && styles.reorderButtonDisabled]}
                    >
                      <Ionicons name="arrow-down" size={16} color={index === portfolio.length - 1 ? colors.textSecondary : CultureTokens.indigo} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleRemovePortfolioItem(index)}
                      accessibilityLabel={`Remove portfolio item ${index + 1}`}
                      accessibilityRole="button"
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={18} color={colors.textSecondary} />
                    </Pressable>
                  </View>
                </View>

                {/* Caption input */}
                <TextInput
                  value={item.caption || ''}
                  onChangeText={(text) => handleCaptionChange(index, text)}
                  placeholder="Add caption (optional)"
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel={`Caption for portfolio item ${index + 1}`}
                  style={[
                    styles.captionInput,
                    { color: colors.text, borderColor: colors.border },
                  ]}
                />
              </View>
            ))}
          </View>
        )}

        {/* Add image button */}
        {portfolio.length < 20 && (
          <Pressable
            onPress={handleAddImage}
            accessibilityLabel="Add portfolio image"
            accessibilityRole="button"
            style={[styles.uploadButton, { borderColor: colors.border }]}
          >
            <Ionicons name="image-outline" size={22} color={CultureTokens.indigo} />
            <Text style={[styles.uploadButtonText, { color: CultureTokens.indigo }]}>
              Add Image
            </Text>
          </Pressable>
        )}

        {/* Video embed input */}
        {portfolio.length < 20 && (
          <View style={styles.videoEmbedRow}>
            <TextInput
              value={videoUrl}
              onChangeText={setVideoUrl}
              placeholder="Paste YouTube or Vimeo URL"
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Video embed URL"
              autoCapitalize="none"
              keyboardType="url"
              style={[
                styles.textInput,
                { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
            />
            <Pressable
              onPress={handleAddVideoEmbed}
              disabled={!videoUrl.trim()}
              accessibilityLabel="Add video to portfolio"
              accessibilityRole="button"
              style={[
                styles.addVideoButton,
                !videoUrl.trim() && styles.addVideoButtonDisabled,
              ]}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        {/* Portfolio count */}
        <Text style={[styles.fieldHint, { color: colors.textSecondary }]}>
          {portfolio.length}/20 items (minimum 3 required)
        </Text>

        {getFieldError('artistData.portfolio') && (
          <Text style={styles.errorText} accessibilityRole="alert">
            {getFieldError('artistData.portfolio')}
          </Text>
        )}
      </View>

      {/* ================================================================== */}
      {/* Section 2: Genres / Mediums */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">
              Genres &amp; Mediums
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Select your artistic genres and mediums. AI can recommend based on your portfolio.
            </Text>
          </View>
          {/* AI Recommend button */}
          <Pressable
            onPress={handleAIRecommendGenres}
            disabled={isLoadingAI || portfolio.length === 0}
            accessibilityLabel="AI recommend genres from portfolio"
            accessibilityRole="button"
            style={[
              styles.aiButton,
              (isLoadingAI || portfolio.length === 0) && styles.aiButtonDisabled,
            ]}
          >
            {isLoadingAI ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            )}
            <Text style={styles.aiButtonText}>
              {isLoadingAI ? 'Analysing...' : 'AI Suggest'}
            </Text>
          </Pressable>
        </View>

        {/* Search filter */}
        <TextInput
          value={genreSearch}
          onChangeText={setGenreSearch}
          placeholder="Search genres..."
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel="Search genres"
          style={[
            styles.textInput,
            { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          ]}
        />

        {/* Genre chips */}
        <View style={styles.chipGrid} accessible accessibilityLabel="Genre selection">
          {filteredGenres.map((genre) => {
            const isSelected = genres.includes(genre);
            return (
              <Pressable
                key={genre}
                onPress={() => handleToggleGenre(genre)}
                accessibilityLabel={`${isSelected ? 'Remove' : 'Add'} ${genre}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                style={[
                  styles.genreChip,
                  { borderColor: colors.border },
                  isSelected && {
                    borderColor: CultureTokens.teal,
                    backgroundColor: `${CultureTokens.teal}15`,
                  },
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color={CultureTokens.teal} />
                )}
                <Text
                  style={[
                    styles.genreChipText,
                    { color: colors.text },
                    isSelected && { color: CultureTokens.teal },
                  ]}
                >
                  {genre}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {genres.length > 0 && (
          <Text style={[styles.fieldHint, { color: colors.textSecondary }]}>
            {genres.length} selected
          </Text>
        )}

        {getFieldError('artistData.genres') && (
          <Text style={styles.errorText} accessibilityRole="alert">
            {getFieldError('artistData.genres')}
          </Text>
        )}
      </View>

      {/* ================================================================== */}
      {/* Section 3: Representation / Agent */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">
          Representation / Agent
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Optionally provide your agent or manager&apos;s contact details.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Agent Name</Text>
          <TextInput
            value={representation?.name || ''}
            onChangeText={(text) => handleRepresentationChange('name', text)}
            placeholder="e.g. Jane Smith"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Agent name"
            style={[
              styles.textInput,
              { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Agent Email</Text>
          <TextInput
            value={representation?.email || ''}
            onChangeText={(text) => handleRepresentationChange('email', text)}
            placeholder="agent@agency.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityLabel="Agent email"
            style={[
              styles.textInput,
              { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
          />
          {getFieldError('artistData.representation.email') && (
            <Text style={styles.errorText} accessibilityRole="alert">
              {getFieldError('artistData.representation.email')}
            </Text>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Agent Phone</Text>
          <TextInput
            value={representation?.phone || ''}
            onChangeText={(text) => handleRepresentationChange('phone', text)}
            placeholder="+61 400 000 000"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            accessibilityLabel="Agent phone number"
            style={[
              styles.textInput,
              { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
          />
          {getFieldError('artistData.representation.phone') && (
            <Text style={styles.errorText} accessibilityRole="alert">
              {getFieldError('artistData.representation.phone')}
            </Text>
          )}
        </View>
      </View>

      {/* ================================================================== */}
      {/* Section 4: Availability Calendar */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">
          Performance Availability
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Tap dates to cycle: Available → Unavailable → Booked → Clear.
        </Text>

        {/* Calendar navigation */}
        <View style={styles.calendarNav}>
          <Pressable
            onPress={handlePrevMonth}
            accessibilityLabel="Previous month"
            accessibilityRole="button"
            hitSlop={8}
            style={styles.calendarNavButton}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={[styles.calendarMonthLabel, { color: colors.text }]}>
            {monthLabel}
          </Text>
          <Pressable
            onPress={handleNextMonth}
            accessibilityLabel="Next month"
            accessibilityRole="button"
            hitSlop={8}
            style={styles.calendarNavButton}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Day headers */}
        <View style={styles.calendarDayHeaders}>
          {DAYS_OF_WEEK.map((day) => (
            <Text key={day} style={[styles.calendarDayHeader, { color: colors.textSecondary }]}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {calendarGrid.map((cell, index) => {
            if (!cell) {
              return <View key={`empty-${index}`} style={styles.calendarCell} />;
            }
            const status = getDateStatus(cell.dateStr);
            const statusColor = getStatusColor(status);
            return (
              <Pressable
                key={cell.dateStr}
                onPress={() => handleDatePress(cell.dateStr)}
                accessibilityLabel={`${cell.day} ${monthLabel}, status: ${status || 'not set'}`}
                accessibilityRole="button"
                style={[
                  styles.calendarCell,
                  styles.calendarCellActive,
                  { borderColor: colors.border },
                  status && { backgroundColor: `${statusColor}20`, borderColor: statusColor },
                ]}
              >
                <Text style={[styles.calendarCellText, { color: colors.text }]}>
                  {cell.day}
                </Text>
                {status && <View style={[styles.calendarDot, { backgroundColor: statusColor }]} />}
              </Pressable>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: CultureTokens.teal }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: CultureTokens.coral }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Booked</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#9CA3AF' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Unavailable</Text>
          </View>
        </View>

        {getFieldError('artistData.availabilityCalendar') && (
          <Text style={styles.errorText} accessibilityRole="alert">
            {getFieldError('artistData.availabilityCalendar')}
          </Text>
        )}
      </View>

      {/* ================================================================== */}
      {/* Section 5: Booking Lead Time */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">
          Booking Lead Time
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Minimum days notice required for bookings.
        </Text>

        <View style={styles.leadTimeOptions} accessibilityRole="radiogroup" accessibilityLabel="Booking lead time">
          {LEAD_TIME_OPTIONS.map((days) => {
            const isSelected = bookingLeadTime === days;
            const label = days === 1 ? '1 day' : `${days} days`;
            return (
              <Pressable
                key={days}
                onPress={() => updateArtistData({ bookingLeadTime: days })}
                accessibilityLabel={`${label} lead time`}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.leadTimeChip,
                  { borderColor: colors.border },
                  isSelected && {
                    borderColor: CultureTokens.indigo,
                    backgroundColor: `${CultureTokens.indigo}15`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.leadTimeChipText,
                    { color: colors.text },
                    isSelected && { color: CultureTokens.indigo },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {getFieldError('artistData.bookingLeadTime') && (
          <Text style={styles.errorText} accessibilityRole="alert">
            {getFieldError('artistData.bookingLeadTime')}
          </Text>
        )}
      </View>

      {/* Bottom Padding */}
      <View style={styles.bottomPadding} />
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
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  contentDesktop: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
  },
  header: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    lineHeight: 22,
  },
  section: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  sectionHeaderText: {
    flex: 1,
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    lineHeight: 24,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    lineHeight: 20,
  },
  fieldGroup: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    lineHeight: 20,
  },
  fieldHint: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    lineHeight: 16,
    marginTop: 4,
  },
  textInput: {
    height: InputTokens.height,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: InputTokens.paddingH,
    fontSize: InputTokens.fontSize,
    fontFamily: FontFamily.medium,
  },
  errorText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: CultureTokens.coral,
    marginTop: 4,
  },
  // Portfolio
  portfolioList: {
    gap: Spacing.sm,
  },
  portfolioItem: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  portfolioItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  portfolioItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  portfolioItemType: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  portfolioItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reorderButton: {
    padding: 4,
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  captionInput: {
    height: 36,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: ButtonTokens.height.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
  },
  uploadButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  videoEmbedRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  addVideoButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: CultureTokens.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addVideoButtonDisabled: {
    opacity: 0.4,
  },
  // Genres
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: CultureTokens.violet,
  },
  aiButtonDisabled: {
    opacity: 0.5,
  },
  aiButtonText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#FFFFFF',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  genreChipText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  // Calendar
  calendarNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarNavButton: {
    padding: Spacing.sm,
  },
  calendarMonthLabel: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
  },
  calendarDayHeaders: {
    flexDirection: 'row',
  },
  calendarDayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    paddingVertical: Spacing.xs,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: Radius.sm,
  },
  calendarCellActive: {
    borderWidth: 1,
  },
  calendarCellText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  calendarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  calendarLegend: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  // Lead Time
  leadTimeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  leadTimeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  leadTimeChipText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  bottomPadding: {
    height: Spacing.xxl,
  },
});

export default ArtistFields;
