/**
 * Stripe Connect — seller onboarding tied to directory profiles (publisherProfileId).
 *
 * POST /stripe/connect/create-account  { profileId }
 * POST /stripe/connect/account-link    { profileId, refreshUrl?, returnUrl? }
 * GET  /stripe/connect/status          ?profileId=
 */

import type { Request, Response , Router } from 'express';
import { stripeClient } from '../admin';
import { requireAuth, requireRevocationCheck, isOwnerOrAdmin } from '../middleware/auth';
import { profilesService } from '../services/firestore';
import { mapConnectFieldsFromStripeAccount } from '../services/stripeConnect';
import { captureRouteError, getFirebaseProjectId } from './utils';

function appBaseUrl(): string {
  const projectId = getFirebaseProjectId();
  return (
    process.env.APP_URL ??
    (projectId ? `https://${projectId}.web.app` : 'https://localhost:5000')
  );
}

export function registerStripeConnectRoutes(router: Router): void {
  router.post('/stripe/connect/create-account', requireAuth, requireRevocationCheck, async (req: Request, res: Response) => {
    const profileId = String((req.body as { profileId?: string })?.profileId ?? '').trim();
    if (!profileId) return res.status(400).json({ error: 'profileId is required' });
    if (!stripeClient) {
      return res.status(503).json({ error: 'Payment service unavailable.', code: 'STRIPE_NOT_CONFIGURED' });
    }

    try {
      const profile = await profilesService.getById(profileId);
      if (!profile) return res.status(404).json({ error: 'Profile not found' });
      if (!isOwnerOrAdmin(req.user!, profile.ownerId ?? null)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      if (profile.stripeConnectAccountId) {
        return res.json({
          accountId: profile.stripeConnectAccountId,
          alreadyExists: true,
          onboardingStatus: profile.stripeConnectOnboardingStatus ?? 'pending',
          payoutsEnabled: profile.payoutsEnabled === true,
        });
      }

      const country =
        String(profile.country ?? 'Australia').toLowerCase() === 'new zealand'
          ? 'NZ'
          : String(profile.country ?? 'AU').length === 2
            ? String(profile.country).toUpperCase()
            : 'AU';

      const account = await stripeClient.accounts.create({
        type: 'express',
        country,
        email: req.user!.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          culturepassProfileId: profileId,
          ownerUserId: profile.ownerId ?? '',
        },
      });

      await profilesService.update(profileId, {
        stripeConnectAccountId: account.id,
        stripeConnectOnboardingStatus: 'pending',
        payoutsEnabled: false,
      });

      return res.status(201).json({ accountId: account.id, alreadyExists: false });
    } catch (err) {
      captureRouteError(err, 'POST /stripe/connect/create-account');
      return res.status(500).json({ error: 'Failed to create Connect account' });
    }
  });

  router.post('/stripe/connect/account-link', requireAuth, requireRevocationCheck, async (req: Request, res: Response) => {
    const body = req.body as { profileId?: string; refreshUrl?: string; returnUrl?: string };
    const profileId = String(body?.profileId ?? '').trim();
    if (!profileId) return res.status(400).json({ error: 'profileId is required' });
    if (!stripeClient) {
      return res.status(503).json({ error: 'Payment service unavailable.', code: 'STRIPE_NOT_CONFIGURED' });
    }

    try {
      const profile = await profilesService.getById(profileId);
      if (!profile) return res.status(404).json({ error: 'Profile not found' });
      if (!isOwnerOrAdmin(req.user!, profile.ownerId ?? null)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const accountId = profile.stripeConnectAccountId;
      if (!accountId) {
        return res.status(400).json({ error: 'Create a Connect account first' });
      }

      const base = appBaseUrl();
      const refreshUrl = String(body.refreshUrl ?? `${base}/dashboard/organizer?connect=refresh`).trim();
      const returnUrl = String(body.returnUrl ?? `${base}/dashboard/organizer?connect=return`).trim();

      const link = await stripeClient.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return res.json({ url: link.url });
    } catch (err) {
      captureRouteError(err, 'POST /stripe/connect/account-link');
      return res.status(500).json({ error: 'Failed to create onboarding link' });
    }
  });

  router.get('/stripe/connect/status', requireAuth, requireRevocationCheck, async (req: Request, res: Response) => {
    const profileId = String(req.query.profileId ?? '').trim();
    if (!profileId) return res.status(400).json({ error: 'profileId is required' });
    if (!stripeClient) {
      return res.status(503).json({ error: 'Payment service unavailable.', code: 'STRIPE_NOT_CONFIGURED' });
    }

    try {
      const profile = await profilesService.getById(profileId);
      if (!profile) return res.status(404).json({ error: 'Profile not found' });
      if (!isOwnerOrAdmin(req.user!, profile.ownerId ?? null)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const accountId = profile.stripeConnectAccountId;
      if (!accountId) {
        return res.json({
          accountId: null,
          stripeConnectOnboardingStatus: 'not_started' as const,
          payoutsEnabled: false,
          chargesEnabled: false,
        });
      }

      const account = await stripeClient.accounts.retrieve(accountId);
      const mapped = mapConnectFieldsFromStripeAccount(account);

      await profilesService.update(profileId, {
        stripeConnectOnboardingStatus: mapped.stripeConnectOnboardingStatus,
        payoutsEnabled: mapped.payoutsEnabled,
      });

      return res.json({
        accountId,
        stripeConnectOnboardingStatus: mapped.stripeConnectOnboardingStatus,
        payoutsEnabled: mapped.payoutsEnabled,
        chargesEnabled: account.charges_enabled === true,
        detailsSubmitted: account.details_submitted === true,
      });
    } catch (err) {
      captureRouteError(err, 'GET /stripe/connect/status');
      return res.status(500).json({ error: 'Failed to load Connect status' });
    }
  });
}
