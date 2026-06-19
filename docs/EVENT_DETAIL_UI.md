# Event Detail UI — Info Document

**Status:** Living document  
**Last updated:** 2026-06-13  
**Primary implementation:** `src/modules/events/components/detail/EventInfoDocument.tsx`

Event detail pages surface a structured **info document** (sidebar on desktop, top of content on mobile) so attendees always see the same fields ticketing sites use — even when API data is partial.

---

## Layout

| Field | Label | Example | Fallback |
|-------|-------|---------|----------|
| Host | **Organised by** | SIAA Sydney | Organiser details unavailable (never raw uids) |
| Action | **Contact Organiser** | In-app enquiry, or email when configured | Prompts sign-in |
| Schedule | **Date And Time** | Sunday, 23 Aug @ 11:00 AM (AEST) - Sunday, 23 Aug @ 09:00 PM (AEST) | Date TBA |
| Place | **Location** | 4-6 Blaxcell Street, Granville NSW | Location TBC |
| Taxonomy | **Event Types** | Festival or Fair | Not listed yet |
| Taxonomy | **Event Category** | Community & Culture | Cultural event |
| Action | **Add to Calendar** | Downloads `.ics` (web) or native calendar (mobile) | — |
| Social | **Share With Friends** | Copy Link, Facebook, Twitter, LinkedIn, Pinterest | — |

Long-form description, accessibility, artists, and tickets remain in the main column (`DetailsSection`, `TicketsSection`, `HostSection`).

---

## Data resolution

| UI field | Source (priority order) |
|----------|-------------------------|
| Organised by | Publisher/community profile name → `hostInfo` / `hostName` → linked community name → fallback label (uids are never shown) |
| Date range | `date` + `time` → `endDate` + `endTime`; timezone from `event.timezone` or Australia/Sydney |
| Location | `address`, `venue`, `city`, `state`, `country` via `formatEventFullAddress()` |
| Event Types | `metadata.eventikTypes[0]` → `eventType` → matching tag |
| Event Category | `category` → `metadata.eventikCategories[0]` → mapped `eventType` |

Helpers live in:

- `src/lib/presentation.ts` — `formatEventFullAddress`, `resolveEventTypeLabel`, `resolveEventCategoryLabel`, `DISPLAY_FALLBACK`
- `src/lib/dateUtils.ts` — `formatEventDateTimeLong`, `formatEventDateTimeRange`, `formatEventTimezoneAbbrev`

---

## Responsive behaviour

- **Desktop (≥ breakpoint):** `EventInfoDocument` renders in the right sidebar (`EventPageOrchestrator` sidebar column, 380px).
- **Mobile / tablet:** Same component renders immediately below the hero, before “At a glance” snapshot tiles.

---

## Share actions

`EventShareActions` builds platform URLs:

- **Copy Link** — `expo-clipboard` + confirmation alert on web
- **Facebook** — `facebook.com/sharer/sharer.php`
- **Twitter** — `twitter.com/intent/tweet`
- **LinkedIn** — `linkedin.com/sharing/share-offsite`
- **Pinterest** — `pinterest.com/pin/create/button`

Canonical share URL: `siteUrl(canonicalEventPath(event))`.

---

## Calendar export

**Add to Calendar** calls `useCalendarSync().exportEventToCalendar(event)`:

- Web: downloads an ICS file including start/end, location, and description
- Native: device calendar integration via `useCalendarSync.native.ts`

---

## Related files

| File | Role |
|------|------|
| `EventDetailScreenPage.tsx` | Wires panel, calendar export, contact organiser |
| `EventShareActions.tsx` | Social + copy row |
| `DetailsSection.tsx` | Extended plan-your-visit grid |
| `HostSection.tsx` | Host card + email / website actions |
| `presentation.ts` | Shared fallbacks for sparse payloads |