<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into CulturePass across two runs. The project already had a solid PostHog foundation (`posthog-react-native`, `PostHogProvider` in `_layout.tsx`, screen tracking, user identification on login/signup, and a rich set of funnel and detail-screen events). Both runs extended coverage to fill critical gaps, with the EU host environment variables confirmed and correctly set.

## Events added (run 2 — onboarding, scanner, city subscriptions)

| Event | Description | File |
|---|---|---|
| `host_application_started` | User selects host types and clicks "Continue to Application" during onboarding. Includes `selected_types`, `type_count`. | `src/app/(onboarding)/host-application.tsx` |
| `host_application_skipped` | User skips the host application step. Includes `had_selections`. | `src/app/(onboarding)/host-application.tsx` |
| `ticket_scan_success` | Organizer scans a ticket at the gate and it is accepted. Includes `ticket_code`, `outcome`, `ticket_id`. | `src/app/scanner.tsx` |
| `ticket_scan_failed` | Organizer scans a ticket and it is rejected or duplicate. Includes `ticket_code`, `outcome`, `message`. | `src/app/scanner.tsx` |
| `contact_scanned` | User looks up a CulturePass member via QR or CPID. Includes `cpid`, `resolved`, `tier`. | `src/app/scanner.tsx` |
| `contact_saved` | User saves a scanned CulturePass member to their contacts. Includes `cpid`, `tier`, `source`. | `src/app/scanner.tsx` |
| `onboarding_completed` | User finishes the full onboarding flow. Includes `city`, `country`, `interest_count`, `community_count`, `skipped_steps`. | `src/contexts/OnboardingContext.tsx` |
| `city_subscribed` | User subscribes to receive updates for a city. Includes `city`, `country`. | `src/contexts/SavedContext.tsx` |
| `city_unsubscribed` | User unsubscribes from city updates. Includes `city`, `country`. | `src/contexts/SavedContext.tsx` |

## Events added (run 1 — membership, community, perks)

| Event | Description | File |
|---|---|---|
| `membership_cancelled` | CulturePass+ membership cancelled. Includes `previous_billing_period`. | `src/hooks/useMembershipUpgrade.ts` |
| `membership_billing_period_changed` | User toggles monthly/yearly billing. Includes `from`, `to`. | `src/hooks/useMembershipUpgrade.ts` |
| `community_joined` | User joins a community. Includes `community_id`. | `src/contexts/SavedContext.tsx` |
| `community_left` | User leaves a community. Includes `community_id`. | `src/contexts/SavedContext.tsx` |
| `perk_upgrade_prompted` | Non-member taps Redeem on a gated perk, redirected to upgrade. | `src/app/perks/[id].tsx` |

## Previously existing events (no changes needed)

`ticket_purchase_completed` · `funnel_stage` · `membership_upgrade_started` · `perk_viewed` · `perk_redeemed` · `event_detail_viewed` · `event_shared` · `event_save_toggled` · `event_rsvp_submitted` · `event_get_tickets_tapped` · `search_performed` · `search_result_tapped` · `Login Success` · `Signup Success` · `artist_profile_viewed` · full `hostspace_form_*` wizard analytics suite · screen tracking via `posthog.screen()`

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/700421)
- [New Signups & Logins](/insights/h80axdbi) — daily signup and login trend
- [Event-to-Ticket Conversion Funnel](/insights/wC5QGoiz) — `event_detail_viewed` → `event_get_tickets_tapped` → `ticket_purchase_completed`
- [Onboarding Completions](/insights/a4Z4FDtc) — daily activated users (leading retention indicator)
- [Community & Host Engagement](/insights/y6MoppHH) — weekly community joins + host application starts
- [Membership Upgrades vs Cancellations](/insights/ZtGxVWVQ) — weekly subscription growth vs churn

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-expo/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
