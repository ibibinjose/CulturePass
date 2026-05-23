# CulturePass — Screen Templates

> 8 canonical layout templates that cover every screen in the app.
> Every screen is assigned to exactly one template. Apply the template pattern exactly.
> Reference: `docs/DESIGN_TOKENS.md` for token values.

---

## Template Map

| Template | Name | Screens |
|---|---|---|
| T1 | Rail Feed | Discover, Events, Feed, Movies, Restaurants, Activities, Shopping, Explore, Directory, Culture index |
| T2 | Detail Hero | event/[id], artist/[id], business/[id], venue/[id], organiser/[id], movie/[id], restaurant/[id], shopping/[id], activity/[id], community/[id], perk/[id], culture/[slug] |
| T3 | Grid Browse | communities/index, saved, contacts/index, perks/index, perks tab |
| T4 | Auth Form | login, signup, forgot-password, culture-match, interests, location (onboarding) |
| T5 | Wizard Step | event/create (9 steps), submit/* (7 steps) |
| T6 | Settings List | settings/*, legal/*, help/index, about |
| T7 | Dashboard | dashboard/organizer, venue, sponsor, wallet-readiness, widgets, admin/dashboard, admin/* |
| T8 | Profile | profile/index, profile/[id], user/[id], organiser/[id] (public profile variant) |

---

## T1 — Rail Feed

**Used by**: Discover (`index.tsx`), Events (`events.tsx`), Feed (`feed.tsx`), Movies, Restaurants, Activities, Shopping, Explore, Directory, Culture index

### Component Stack

```
<ErrorBoundary>
  <ScreenShell>                          ← background + safe area
    <TabPrimaryHeader                     ← sticky header with glass blur
      title="…"
      subtitle="…"                        ← optional location/count
      hPad={hPad}
      topInset={topInset}
      withGlobalNav={true}
    >
      <FilterChips … />                   ← optional filter row (36px chips)
    </TabPrimaryHeader>

    <FlashList / FlatList
      ListHeaderComponent={<>
        <HeroSection />                   ← optional featured hero
        <RailSection title="…" />         ← horizontal carousels
        …
      </>}
      data={items}
      renderItem={({ item, index }) =>
        <CardComponent
          entering={FadeInDown.delay(index * 60)}
          …
        />
      }
      ListEmptyComponent={<EmptyState … />}
      refreshControl={<RefreshControl … />}
      contentContainerStyle={{ paddingBottom: bottomPad }}
    />
  </ScreenShell>
</ErrorBoundary>
```

### Visual Rules

- **Header**: `TabPrimaryHeader` — title Bold 20px, subtitle 13px textSecondary, glass blur backing.
- **Filter chips**: `AnimatedFilterChip` — 36px height, pill shape, `primaryGlow` BG when active.
- **Content rails**: horizontal `ScrollView`, show 2.5 cards (peek pattern), `Spacing.md` gap.
- **Grid cards**: 2 cols mobile, 3 cols tablet/desktop. `CardTokens.radius` = 16px. `Elevation[1]` shadow.
- **Card image ratio**: 4:3 (standard events/content). Use `CultureImage` always.
- **Category colour coding**: apply `CategoryColors.*` as accent on card border or tag pill.
- **Entry animation**: `FadeInDown.delay(index * 60).springify()` on every grid item.
- **Loading state**: skeleton grid matching card layout (`Skeleton` components).
- **Empty state**: `EmptyState` component with icon, title2, body, optional CTA button.
- **Section spacing**: `Spacing.xl` (32px) between sections.
- **Bottom padding**: `tabBarHeight + insets.bottom + 16` to clear tab bar.

---

## T2 — Detail Hero

**Used by**: event/[id], artist/[id], business/[id], venue/[id], organiser/[id], movie/[id], restaurant/[id], shopping/[id], activity/[id], community/[id], perk/[id], culture/[slug]

### Component Stack

```
<ErrorBoundary>
  <ScreenShell edges={[]}>              ← no safe-area edges (hero fills top)
    <ScrollView>
      <HeroPanel                         ← new shared component
        uri={imageUrl}
        height={320}                     ← 320px mobile, 400px desktop
        gradient={gradients.heroOverlay} ← always apply
      >
        <BackButton circled style={styles.backBtn} />   ← top-left
        <ShareButton style={styles.shareBtn} />         ← top-right (if applicable)
        <HeroBadge>{categoryLabel}</HeroBadge>          ← top-left below back (optional)
        <View style={styles.heroContent}>
          <Text style={TextStyles.hero}>{title}</Text>
          <MetaRow … />
        </View>
      </HeroPanel>

      {/* Content sections — each in LiquidGlassPanel */}
      <LiquidGlassPanel style={styles.section}>
        <SectionDivider />               ← 32px spacer between sections
        …content…
      </LiquidGlassPanel>

      <SectionDivider />
      <LiquidGlassPanel style={styles.section}>…</LiquidGlassPanel>

      <View style={{ height: bottomPad }} />
    </ScrollView>

    {/* Sticky footer CTA */}
    <StickyFooter>
      <Button variant="primary" fullWidth>Get Tickets</Button>
    </StickyFooter>
  </ScreenShell>
</ErrorBoundary>
```

### Visual Rules

- **Hero height**: 320px mobile, 400px on tablet/desktop.
- **Gradient overlay**: always `gradients.heroOverlay` (`['transparent', 'rgba(0,0,0,0.6)']`) over image.
- **Back button**: `BackButton circled={true}` at `top: topInset + 12, left: 16`. White icon on dark overlay.
- **Hero title**: `TextStyles.hero` (28px Bold) in white, bottom of hero area, `hPad` from edges.
- **Content sections**: wrapped in `LiquidGlassPanel` with `cornerRadius=LiquidGlassTokens.corner.mainCard` (28px), `hPad` margins.
- **Section spacing**: `SectionDivider` (32px) between every `LiquidGlassPanel` section.
- **Sticky footer**: glass-backed, contains single primary CTA (52px, full width). Positioned above tab bar.
- **Loading**: `EventDetailSkeleton` or equivalent — hero skeleton + content rows.

---

## T3 — Grid Browse

**Used by**: communities/index, saved, contacts/index, perks/index (grid layout variant)

### Component Stack

```
<ErrorBoundary>
  <ScreenShell>
    <TabPrimaryHeader title="…" hPad={hPad} topInset={topInset}>
      <FilterChips … />
    </TabPrimaryHeader>

    <FlatList
      numColumns={numColumns}            ← 2 mobile, 3 tablet/desktop
      data={items}
      renderItem={({ item, index }) =>
        <BrowseCard
          entering={FadeInDown.delay(index * 60)}
          …
        />
      }
      columnWrapperStyle={{ gap: Spacing.md }}
      ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      ListHeaderComponent={<CountBar count={items.length} />}
      ListEmptyComponent={<EmptyState … />}
      refreshControl={<RefreshControl … />}
      contentContainerStyle={{ paddingHorizontal: hPad, paddingBottom: bottomPad }}
    />
  </ScreenShell>
</ErrorBoundary>
```

### Visual Rules

- **Header**: identical to T1 (`TabPrimaryHeader` with optional filter row).
- **Grid**: `numColumns` from `useLayout()` — 2 mobile, 3 tablet/desktop.
- **Card**: square-ish aspect ratio (~1:1 for communities/perks, ~3:2 for general content).
- **Count bar**: small caption above grid showing "X items" in `textTertiary`.
- **Clear filters**: always visible when filters are active — secondary button at top right.

---

## T4 — Auth Form

**Used by**: login, signup, forgot-password, culture-match, interests, location (onboarding)

### Component Stack

```
<ErrorBoundary>
  <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={80}>
    <AuthAmbientBackground>             ← gradient mesh background

      {/* Mobile header */}
      <AuthMobileHeader variant="close-with-brand" />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Web: 2-column layout */}
        {isDesktop && <AuthMarketingColumn … />}

        {/* Form column */}
        <View style={styles.formColumn}>
          <BrandLockup size="md" logoSize={64} />   ← always 64px, not 69px

          <AuthLiquidFormCard>
            <Text style={TextStyles.title}>{heading}</Text>
            <Text style={[TextStyles.callout, { color: colors.textSecondary }]}>
              {subheading}
            </Text>

            {/* Form fields */}
            <Input … />
            <Button variant="primary" fullWidth>Continue</Button>

            {/* Social auth */}
            <SocialButton provider="google" />
            <SocialButton provider="apple" />
          </AuthLiquidFormCard>

          {/* Footer links */}
          <Text style={TextStyles.caption}>
            Already have an account?{' '}
            <Text onPress={…} style={{ color: colors.primary }}>Sign in</Text>
          </Text>
        </View>

      </ScrollView>
    </AuthAmbientBackground>
  </KeyboardAvoidingView>
</ErrorBoundary>
```

### Visual Rules

- **BrandLockup**: always `logoSize={64}` — never 69px or other values.
- **Form card**: `AuthLiquidFormCard` — glass panel with 28px radius, inner padding 24px.
- **Desktop**: two-column layout — marketing copy (left, brand gradient BG) + form column (right). Max form width 420px.
- **Mobile**: single column, centred, max width 420px.
- **Progress**: multi-step flows show step progress pill (`{current}/{total}`, indigo fill).
- **CTA**: single primary button (`fullWidth`, `variant="primary"`) at bottom of form.
- **Background**: `AuthAmbientBackground` always — never plain `colors.background`.

---

## T5 — Wizard Step

**Used by**: event/create (steps 1–9), submit/step-*.tsx (steps 1–7)

### Component Stack

```
<ErrorBoundary>
  <ScreenShell>
    {/* Sticky header with progress */}
    <View style={styles.wizardHeader}>
      <BackButton />
      <StepPill current={step} total={totalSteps} />
      <Text style={TextStyles.title2}>{stepTitle}</Text>
    </View>

    <ScrollView contentContainerStyle={{ paddingHorizontal: hPad }}>
      <Text style={[TextStyles.hero, styles.stepHero]}>{stepHeading}</Text>
      <Text style={[TextStyles.callout, { color: colors.textSecondary }]}>
        {stepDescription}
      </Text>

      {/* Fields — each group in LiquidGlassPanel */}
      <LiquidGlassPanel style={styles.fieldGroup}>
        <Text style={[TextStyles.labelSemibold, styles.groupLabel]}>
          {groupLabel}
        </Text>
        <Input … />
        <Input … />
      </LiquidGlassPanel>

      <SectionDivider />

      <LiquidGlassPanel style={styles.fieldGroup}>
        …
      </LiquidGlassPanel>
    </ScrollView>

    {/* Sticky footer */}
    <View style={styles.footer}>
      {step > 1 && (
        <Button variant="secondary" onPress={onBack}>Back</Button>
      )}
      <Button
        variant="primary"
        fullWidth={step === 1}
        onPress={onNext}
        loading={isSaving}
      >
        {isLastStep ? 'Submit' : 'Continue'}
      </Button>
    </View>
  </ScreenShell>
</ErrorBoundary>
```

### Visual Rules

- **Step pill**: `{current} of {total}` — indigo filled progress, 9999px radius pill.
- **Step heading**: `TextStyles.hero` (28px) — large and confident at top of scroll.
- **Field groups**: `LiquidGlassPanel` wrapping logically related fields. Label in `labelSemibold` 14px.
- **Validation errors**: coral border on errored `Input`, `Ionicons name="warning"` + coral text below field.
- **Sticky footer**: glass-backed, `Back` (secondary) + `Continue`/`Submit` (primary). Back is absent on step 1.
- **Auto-save**: show subtle "Saving…" caption when auto-saving drafts.

---

## T6 — Settings List

**Used by**: settings/index, settings/appearance, settings/notifications, settings/privacy, settings/location, settings/about, settings/help, legal/*, help/index, about

### Component Stack

```
<ErrorBoundary>
  <ScreenShell>
    <ProfileHeaderBar title="Settings" />   ← back button + title

    <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }}>
      {sections.map(section => (
        <View key={section.id}>
          <Text style={styles.sectionLabel}>{section.title}</Text>

          <LiquidGlassPanel style={styles.sectionCard}>
            {section.items.map((item, i) => (
              <SettingsRow
                key={item.id}
                icon={item.icon}
                iconColor={item.color}
                label={item.label}
                subtitle={item.subtitle}
                action={item.action}       ← 'chevron' | 'toggle' | 'badge' | ReactNode
                showDivider={i < section.items.length - 1}
                onPress={item.onPress}
              />
            ))}
          </LiquidGlassPanel>

          <SectionDivider />
        </View>
      ))}
    </ScrollView>
  </ScreenShell>
</ErrorBoundary>
```

### SettingsRow Anatomy

```
┌─────────────────────────────────────────────┐
│  [IconWell] Label            [action/chevron]│
│             Subtitle                         │
└─────────────────────────────────────────────┘
```

- **IconWell**: 40×40px rounded square (radius 10px), `itemColor` at 15% opacity BG, icon 20px in `itemColor`.
- **Label**: `TextStyles.body` (16px), `colors.text`.
- **Subtitle**: `TextStyles.caption` (12px), `colors.textSecondary`.
- **Action**: `Ionicons name="chevron-forward"` (18px, `colors.textTertiary`) or `<Switch />` or badge text.
- **Divider**: 1px `colors.divider`, inset 56px from left (clears the icon well).

### Section Label Style

```typescript
{
  ...TextStyles.badgeCaps,      // 11px SemiBold, 1.2 letter-spacing, uppercase
  color: colors.textTertiary,
  paddingHorizontal: hPad,
  paddingTop: 24,
  paddingBottom: 8,
}
```

---

## T7 — Dashboard

**Used by**: dashboard/organizer, venue, sponsor, wallet-readiness, widgets, admin/dashboard, admin/*

### Component Stack

```
<ErrorBoundary>
  <DashboardShell role={role}>           ← sets header with role badge
    <ScrollView
      refreshControl={<RefreshControl … />}
      contentContainerStyle={{ paddingHorizontal: hPad, paddingBottom: bottomPad }}
    >
      {/* Stats row */}
      <View style={styles.statsRow}>
        {stats.map(stat => (
          <StatCard
            key={stat.id}
            value={stat.value}
            label={stat.label}
            trend={stat.trend}            ← +12% green / -3% coral
            accentColor={roleAccentColor}
            style={styles.statCard}
          />
        ))}
      </View>

      <SectionDivider />

      {/* Content sections */}
      <SectionHeader title="Recent Events" rightAction={…} />
      <LiquidGlassPanel>
        {events.map((e, i) => (
          <DashboardRow key={e.id} item={e} showDivider={i < events.length - 1} />
        ))}
      </LiquidGlassPanel>

      <SectionDivider />

      {/* Action cards */}
      <SectionHeader title="Quick Actions" />
      <View style={styles.actionGrid}>
        {actions.map(action => (
          <ActionCard key={action.id} … />
        ))}
      </View>
    </ScrollView>
  </DashboardShell>
</ErrorBoundary>
```

### Visual Rules

- **Role accent colours**: organizer=`CultureTokens.indigo`, venue=`CultureTokens.teal`, sponsor=`CultureTokens.gold`, admin=`CultureTokens.purple`.
- **Stat cards**: `Elevation[2]`, accent border-top (3px, role accent colour), `colors.card` BG. Value in `TextStyles.title` (24px Bold).
- **Role badge**: pill in header showing role (organizer/venue/admin etc.) in role accent color.
- **Data rows**: `LiquidGlassPanel` with consistent rows — label + value + status badge + action.
- **Status badges**: `<Badge variant="success|warning|error|primary">` — never raw coloured text.
- **Admin variant**: purple accent, `DashboardShell` with admin badge.

---

## T8 — Profile

**Used by**: profile/index, profile/[id], profile/public, user/[id], organiser/[id] (public profile)

### Component Stack

```
<ErrorBoundary>
  <ScreenShell edges={[]}>
    <ScrollView
      refreshControl={<RefreshControl … />}
      contentContainerStyle={{ paddingBottom: bottomPad }}
    >
      {/* Hero section */}
      <LinearGradient
        colors={[colors.backgroundSecondary, colors.background]}
        style={styles.heroBg}
      >
        <View style={[styles.heroContent, { paddingTop: topInset + 16, paddingHorizontal: hPad }]}>
          <Avatar
            uri={user.photoURL}
            name={user.displayName}
            size="xl"                    ← 72px
            badge={membershipBadge}
            style={styles.avatar}
          />
          <Text style={TextStyles.title2}>{user.displayName}</Text>
          <Text style={[TextStyles.callout, { color: colors.textSecondary }]}>
            @{user.username}
          </Text>

          {/* Culture pills */}
          <CultureTagRow tags={user.cultures} max={4} />

          {/* Stats bar */}
          <View style={styles.statsBar}>
            <StatItem label="Following" value={user.following} />
            <StatDivider />
            <StatItem label="Followers" value={user.followers} />
            <StatDivider />
            <StatItem label="Events" value={user.eventsAttended} />
          </View>
          <LinearGradient
            colors={gradients.culturepassBrand}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.statsAccentLine}  ← 2px height, full width
          />
        </View>
      </LinearGradient>

      {/* Tab sections or scrollable content */}
      <View style={{ paddingHorizontal: hPad }}>
        <SectionDivider />
        <SectionHeader title="Upcoming Events" />
        <EventRail events={upcomingEvents} />

        <SectionDivider />
        <SectionHeader title="Communities" />
        …
      </View>
    </ScrollView>

    {/* Own profile: Edit button; other profile: Follow button */}
    <ProfileHeaderBar
      title=""
      rightAction={isOwnProfile
        ? <Button variant="secondary" size="sm">Edit Profile</Button>
        : <Button variant="primary" size="sm">Follow</Button>
      }
    />
  </ScreenShell>
</ErrorBoundary>
```

### Visual Rules

- **Avatar**: `size="xl"` (72px), circular always, gradient ring from `gradients.culturepassBrand`.
- **Stats bar**: 3 stats in a row, brand gradient accent line (2px, full width) below.
- **Culture pills**: `CultureTagRow` max={4} with `+N` overflow indicator.
- **Social links**: `SocialLinksBar` component — icon-only links row.
- **Section content**: same `SectionHeader` + content pattern as T1.
- **Floating header**: transparent → opaque on scroll (`scrollY > 80`), shows display name.

---

## Shared Components Used Across Templates

### `ScreenShell` *(components/ui/ScreenShell.tsx)*
Applies correct SafeAreaView, `colors.background` fill, optional ambient gradient mesh.
```typescript
<ScreenShell edges={['top', 'bottom']} ambient={false}>
  {children}
</ScreenShell>
```

### `HeroPanel` *(components/ui/HeroPanel.tsx)*
Reusable hero image with gradient overlay, back/share button slots.
```typescript
<HeroPanel uri={imageUrl} height={320}>
  {/* positioned children */}
</HeroPanel>
```

### `EmptyState` *(components/ui/EmptyState.tsx)*
Consistent empty/error/offline states.
```typescript
<EmptyState
  icon="calendar-outline"
  title="No events yet"
  subtitle="Check back soon — your community is growing."
  action={{ label: 'Browse all events', onPress: … }}
/>
```

### `SectionDivider` *(components/ui/SectionDivider.tsx)*
32px vertical spacer (`LayoutRules.sectionSpacing`). Replace all ad-hoc `marginTop`/`paddingTop` section gaps.
```typescript
<SectionDivider />         // 32px
<SectionDivider size="sm" /> // 16px
```

---

## Screen → Template Assignment

| Screen Path | Template |
|---|---|
| `app/(tabs)/index.tsx` | T1 |
| `app/(tabs)/feed.tsx` | T1 |
| `app/(tabs)/calendar.tsx` | T1 (with CalendarMonthGrid header variant) |
| `app/(tabs)/perks.tsx` | T1 |
| `app/(tabs)/community.tsx` | T3 |
| `app/(tabs)/explore.tsx` | T1 |
| `app/(tabs)/directory.tsx` | T3 |
| `app/(tabs)/dashboard.tsx` | T7 |
| `app/(tabs)/profile.tsx` | T8 |
| `app/(tabs)/city.tsx` | T1 |
| `app/(tabs)/menu.tsx` | T6 |
| `app/events.tsx` | T1 |
| `app/movies/index.tsx` | T1 |
| `app/restaurants/index.tsx` | T1 |
| `app/shopping/index.tsx` | T1 |
| `app/activities/index.tsx` | T1 |
| `app/communities/index.tsx` | T3 |
| `app/culture/index.tsx` | T1 |
| `app/perks/index.tsx` | T3 |
| `app/event/[id].tsx` | T2 |
| `app/artist/[id].tsx` | T2 |
| `app/business/[id].tsx` | T2 |
| `app/venue/[id].tsx` | T2 |
| `app/organiser/[id].tsx` | T2 |
| `app/movies/[id].tsx` | T2 |
| `app/restaurants/[id].tsx` | T2 |
| `app/shopping/[id].tsx` | T2 |
| `app/activities/[id].tsx` | T2 |
| `app/community/[id].tsx` | T2 |
| `app/perks/[id].tsx` | T2 |
| `app/culture/[slug].tsx` | T2 |
| `app/(onboarding)/login.tsx` | T4 |
| `app/(onboarding)/signup.tsx` | T4 |
| `app/(onboarding)/forgot-password.tsx` | T4 |
| `app/(onboarding)/culture-match.tsx` | T4 |
| `app/(onboarding)/interests.tsx` | T4 |
| `app/(onboarding)/location.tsx` | T4 |
| `app/(onboarding)/communities.tsx` | T4 |
| `app/event/create.tsx` | T5 |
| `app/submit/*.tsx` | T5 |
| `app/settings/*.tsx` | T6 |
| `app/legal/*.tsx` | T6 |
| `app/help/index.tsx` | T6 |
| `app/about.tsx` | T6 |
| `app/dashboard/organizer.tsx` | T7 |
| `app/dashboard/venue.tsx` | T7 |
| `app/dashboard/sponsor.tsx` | T7 |
| `app/dashboard/wallet-readiness.tsx` | T7 |
| `app/dashboard/widgets.tsx` | T7 |
| `app/dashboard/backstage/[id].tsx` | T7 |
| `app/admin/*.tsx` | T7 |
| `app/profile/index.tsx` | T8 |
| `app/profile/[id].tsx` | T8 |
| `app/profile/edit.tsx` | T6 (settings-list style form) |
| `app/profile/public.tsx` | T8 |
| `app/user/[id].tsx` | T8 |
| `app/contacts/index.tsx` | T3 |
| `app/contacts/[cpid].tsx` | T2 |
| `app/notifications/index.tsx` | T3 (list variant) |
| `app/saved.tsx` | T3 |
| `app/checkout/index.tsx` | T5 (checkout wizard) |
| `app/payment/*.tsx` | T6 |
| `app/tickets/index.tsx` | T3 |
| `app/tickets/[id].tsx` | T2 |
| `app/membership/upgrade.tsx` | T2 (marketing hero) |
| `app/scanner/index.tsx` | custom (full-screen camera) |
| `app/map.tsx` | custom (full-screen map) |
| `app/city/[name].tsx` | T1 |
| `app/hub/**/*.tsx` | T1 |
| `app/hubs/**/*.tsx` | T1 |
| `app/kerala.tsx` | T1 |
| `app/finder.tsx` | T1 |
| `app/get2know.tsx` | T4 (onboarding style) |
| `app/[handle].tsx` | T8 (public profile redirect) |
