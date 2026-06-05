/**
 * Apple / Google Wallet — business card + admin readiness.
 * Ticket pass download is mounted on ticketsRouter (see tickets.ts).
 */

import { Router, type Request, type Response } from 'express';
import { db, isFirestoreConfigured } from '../admin';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  bootstrapGoogleBusinessCardClass,
  createAppleBusinessCardSessionUrl,
  createGoogleBusinessCardSaveUrl,
  generateAppleBusinessCardPass,
  getWalletPassReadiness,
  verifyAppleDownloadToken,
  type WalletPassUser,
} from '../services/walletPasses';
import { captureRouteError } from './utils';

export const walletRouter = Router();

async function loadWalletPassUser(req: Request): Promise<WalletPassUser> {
  const u = req.user!;
  if (!isFirestoreConfigured) {
    return {
      id: u.id,
      username: u.username,
      displayName: u.username,
      email: u.email,
      city: u.city ?? 'Sydney',
      country: u.country ?? 'Australia',
      culturePassId: 'CP-123456',
      tier: 'elite',
    };
  }
  const snap = await db.collection('users').doc(u.id).get();
  const data = snap.data() ?? {};
  // Support both embedded membership.tier and top level for flexibility
  const tier = (data.membership as any)?.tier || (data.tier as string | undefined) || 'free';
  return {
    id: u.id,
    username: u.username,
    displayName: (data.displayName as string | undefined) ?? (data.name as string | undefined) ?? u.username,
    email: u.email ?? (data.email as string | undefined),
    city: (data.city as string | undefined) ?? u.city,
    country: (data.country as string | undefined) ?? u.country,
    culturePassId: data.culturePassId as string | undefined,
    tier,
  };
}

walletRouter.get('/wallet/business-card/apple', requireAuth, async (req: Request, res: Response) => {
  try {
    const readiness = getWalletPassReadiness();
    if (!readiness.apple.ready) {
      return res.status(503).json({
        error: 'Apple Wallet is not configured on the server',
        code: 'WALLET_APPLE_NOT_CONFIGURED',
        missing: readiness.apple.missing,
      });
    }
    const user = await loadWalletPassUser(req);
    const url = createAppleBusinessCardSessionUrl(req, user);
    return res.json({ url, provider: 'apple' as const, userId: user.id });
  } catch (err) {
    captureRouteError(err, 'GET /wallet/business-card/apple');
    return res.status(500).json({ error: 'Failed to create Apple Wallet link' });
  }
});

walletRouter.get('/wallet/business-card/apple/pass', async (req: Request, res: Response) => {
  try {
    const readiness = getWalletPassReadiness();
    if (!readiness.apple.ready) {
      return res.status(503).send('Apple Wallet is not configured');
    }
    const token = String(req.query.token ?? '').trim();
    if (!token) return res.status(400).send('Missing token');

    const payload = verifyAppleDownloadToken(token);
    const user: WalletPassUser = {
      id: payload.sub,
      username: payload.username,
    };
    if (isFirestoreConfigured) {
      const snap = await db.collection('users').doc(payload.sub).get();
      if (snap.exists) {
        const data = snap.data() ?? {};
        user.displayName = (data.displayName as string | undefined) ?? (data.name as string | undefined) ?? payload.username;
        user.email = data.email as string | undefined;
        user.city = data.city as string | undefined;
        user.country = data.country as string | undefined;
        user.culturePassId = data.culturePassId as string | undefined;
      }
    } else {
      user.displayName = payload.username;
      user.culturePassId = 'CP-123456';
    }

    const buffer = await generateAppleBusinessCardPass(user);
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', 'attachment; filename="CulturePass.pkpass"');
    return res.send(buffer);
  } catch (err) {
    captureRouteError(err, 'GET /wallet/business-card/apple/pass');
    return res.status(401).send('Invalid or expired link');
  }
});

walletRouter.get('/wallet/business-card/google', requireAuth, async (req: Request, res: Response) => {
  try {
    const readiness = getWalletPassReadiness();
    if (!readiness.googleBusinessCard.ready) {
      return res.status(503).json({
        error: 'Google Wallet is not configured on the server',
        code: 'WALLET_GOOGLE_NOT_CONFIGURED',
        missing: readiness.googleBusinessCard.missing,
      });
    }
    const user = await loadWalletPassUser(req);
    const url = await createGoogleBusinessCardSaveUrl(user);
    return res.json({ url, provider: 'google' as const, userId: user.id });
  } catch (err) {
    captureRouteError(err, 'GET /wallet/business-card/google');
    return res.status(500).json({ error: 'Failed to create Google Wallet link' });
  }
});

walletRouter.post(
  '/admin/wallet/business-card/google/bootstrap-class',
  requireAuth,
  requireRole('admin', 'platformAdmin'),
  async (_req: Request, res: Response) => {
    try {
      const result = await bootstrapGoogleBusinessCardClass();
      return res.json({ success: true, classId: result.classId, created: result.created });
    } catch (err) {
      captureRouteError(err, 'POST /admin/wallet/business-card/google/bootstrap-class');
      return res.status(500).json({ error: 'Failed to bootstrap Google Wallet class' });
    }
  },
);

walletRouter.get(
  '/admin/wallet/business-card/readiness',
  requireAuth,
  requireRole('admin', 'platformAdmin', 'moderator'),
  (_req: Request, res: Response) => {
    const r = getWalletPassReadiness();
    const ready = r.apple.ready && r.googleBusinessCard.ready;
    return res.json({
      success: true,
      ready,
      apple: r.apple,
      google: r.google,
      googleBusinessCard: r.googleBusinessCard,
    });
  },
);
