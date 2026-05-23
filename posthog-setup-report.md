<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of your project. PostHog was already partially integrated (SDK installed, `PostHogProvider` in `_layout.tsx`, screen tracking, and several key events). The wizard audited all existing coverage, set the correct EU host environment variables, and added 5 new targeted events covering previously untracked churn, community engagement, and perk upsell flows.

## Events added in this session

| Event | Description | File |
|---|---|---|
| `membership_cancelled` | Fired on successful CulturePass+ membership cancellation. Critical churn signal, includes `previous_billing_period`. | `src/hooks/useMembershipUpgrade.ts` |
| `membership_billing_period_changed` | Fired when user toggles between monthly and yearly billing before subscribing. Tracks `from` / `to` periods. | `src/hooks/useMembershipUpgrade.ts` |
| `community_joined` | Fired when a user joins a community via `toggleJoinCommunity`. Includes `community_id`. | `src/contexts/SavedContext.tsx` |
| `community_left` | Fired when a user leaves a community they were previously joined to. Includes `community_id`. | `src/contexts/SavedContext.tsx` |
| `perk_upgrade_prompted` | Fired when a user without CulturePass+ taps Redeem on a membership-gated perk and is redirected to upgrade. Includes `perk_id`, `perk_type`, `perk_title`, `provider_name`. | `src/app/perks/[id].tsx` |

## Previously existing events (already covered)

| Event | File |
|---|---|
| `ticket_purchase_completed` + `funnel_stage` | `src/lib/analytics.ts` |
| `membership_upgrade_started` | `src/hooks/useMembershipUpgrade.ts` |
| `perk_viewed` | `src/app/perks/[id].tsx` |
| `perk_redeemed` | `src/app/perks/[id].tsx` |
| `event_detail_viewed` | `src/modules/events/components/detail/EventDetailScreenPage.tsx` |
| `event_shared` | `src/modules/events/components/detail/EventDetailScreenPage.tsx` |
| `event_save_toggled` | `src/modules/events/components/detail/EventDetailScreenPage.tsx` |
| `event_rsvp_submitted` | `src/modules/events/components/detail/EventDetailScreenPage.tsx` |
| `event_get_tickets_tapped` | `src/modules/events/components/detail/EventDetailScreenPage.tsx` |
| `search_performed` | `src/app/search/index.tsx` |
| `search_result_tapped` | `src/app/search/index.tsx` |
| `Login Success` + `identifyUser` | `src/hooks/useLogin.ts` |
| `Signup Success` + `identifyUser` | `src/hooks/useSignup.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](https://eu.posthog.com/project/185290/dashboard/699929)
- [Ticket Purchase Conversion Funnel](https://eu.posthog.com/project/185290/insights/Z4mKLi36) — event_detail_viewed → event_get_tickets_tapped → ticket_purchase_completed
- [Membership Cancellations vs Upgrade Starts](https://eu.posthog.com/project/185290/insights/undsx3Ju) — churn rate alongside upgrade intent
- [Perk Upsell to Membership Funnel](https://eu.posthog.com/project/185290/insights/7Y0omAXN) — perk_upgrade_prompted → membership_upgrade_started
- [Community Engagement: Joins vs Leaves](https://eu.posthog.com/project/185290/insights/HzQUxXl3) — net community growth indicator
- [New Signups Over Time](https://eu.posthog.com/project/185290/insights/qSD2DDhK) — daily acquisition trend

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
