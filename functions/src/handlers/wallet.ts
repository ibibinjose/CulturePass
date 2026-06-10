/**
 * Apple / Google Wallet — business card + PassKit web service + admin readiness.
 * Ticket pass download is mounted on ticketsRouter (see tickets.ts).
 */

import { Router, type Request, type Response } from 'express';
import { db, isFirestoreConfigured } from '../admin';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  registerDeviceForPass,
  unregisterDeviceForPass,
  listSerialNumbersForDevice,
} from '../services/appleWalletWebService';
import { eventsService, ticketsService } from '../services/firestore';
import {
  bootstrapGoogleBusinessCardClass,
  createAppleBusinessCardSessionUrl,
  createGoogleBusinessCardSaveUrl,
  generateAppleBusinessCardPass,
  generateAppleEventTicketPass,
  getApplePassTypeIdentifier,
  getWalletPassReadiness,
  mergeWalletPassUserFromToken,
  resolveUserIdFromApplePassSerial,
  verifyAppleDownloadToken,
  verifyApplePassAuthorizationHeader,
  type WalletPassUser,
  type WalletTicketInput,
} from '../services/walletPasses';
import { buildDigitalIdSummary } from '../services/digitalIdService';
import { captureRouteError, qparam } from './utils';

export const walletRouter = Router();

function parseFirestoreDate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null) {
    const maybeTimestamp = value as { toDate?: () => Date; _seconds?: number };
    if (typeof maybeTimestamp.toDate === 'function') {
      try {
        return maybeTimestamp.toDate().toISOString();
      } catch {
        return undefined;
      }
    }
    if (typeof maybeTimestamp._seconds === 'number') {
      return new Date(maybeTimestamp._seconds * 1000).toISOString();
    }
  }
  return undefined;
}

async function loadWalletPassUserFromDoc(
  userId: string,
  fallback?: Partial<WalletPassUser>,
): Promise<WalletPassUser> {
  if (!isFirestoreConfigured) {
    return {
      id: userId,
      username: fallback?.username ?? userId,
      displayName: fallback?.displayName ?? fallback?.username ?? userId,
      email: fallback?.email,
      city: fallback?.city ?? 'Sydney',
      country: fallback?.country ?? 'Australia',
      culturePassId: fallback?.culturePassId ?? 'CP-123456',
      tier: fallback?.tier ?? 'free',
    };
  }
  const snap = await db.collection('users').doc(userId).get();
  const data = snap.data() ?? {};
  let tier = (data.membership as { tier?: string } | undefined)?.tier
    ?? (data.tier as string | undefined)
    ?? fallback?.tier
    ?? 'free';
  try {
    const membershipSnap = await db.collection('users').doc(userId).collection('membership').doc('current').get();
    if (membershipSnap.exists) {
      const membershipData = membershipSnap.data() as { tier?: string } | undefined;
      if (membershipData?.tier) tier = membershipData.tier;
    }
  } catch {
    // optional membership subcollection
  }
  const affiliation = data.affiliation as { name?: string } | undefined;
  const createdAt = parseFirestoreDate(data.createdAt)
    ?? parseFirestoreDate(data.created_at)
    ?? fallback?.createdAt;
  return {
    id: userId,
    username: (data.username as string | undefined) ?? fallback?.username ?? userId,
    displayName:
      (data.displayName as string | undefined)
      ?? (data.name as string | undefined)
      ?? fallback?.displayName
      ?? fallback?.username
      ?? userId,
    email: (data.email as string | undefined) ?? fallback?.email,
    city: (data.city as string | undefined) ?? fallback?.city,
    country: (data.country as string | undefined) ?? fallback?.country,
    culturePassId: (data.culturePassId as string | undefined) ?? fallback?.culturePassId,
    tier,
    avatarUrl: (data.avatarUrl as string | undefined) ?? fallback?.avatarUrl,
    createdAt,
    affiliationName: affiliation?.name ?? fallback?.affiliationName,
  };
}

async function loadWalletPassUser(req: Request): Promise<WalletPassUser> {
  const u = req.user!;
  return loadWalletPassUserFromDoc(u.id, {
    username: u.username,
    email: u.email,
    city: u.city,
    country: u.country,
    tier: u.tier,
  });
}

function walletNotReadyResponse(res: Response, provider: 'apple' | 'google', missing: string[]) {
  return res.status(503).json({
    error: `${provider === 'apple' ? 'Apple' : 'Google'} Wallet is not configured on the server`,
    code: provider === 'apple' ? 'WALLET_APPLE_NOT_CONFIGURED' : 'WALLET_GOOGLE_NOT_CONFIGURED',
    missing,
    hint: 'Run scripts/setup-wallet-secrets.sh with real Apple/Google credentials, then deploy functions.',
  });
}

walletRouter.get('/wallet/business-card/apple', requireAuth, async (req: Request, res: Response) => {
  try {
    const readiness = getWalletPassReadiness();
    if (!readiness.apple.ready) {
      return walletNotReadyResponse(res, 'apple', readiness.apple.missing);
    }
    const user = await loadWalletPassUser(req);
    const url = createAppleBusinessCardSessionUrl(req, user);
    return res.json({ url, provider: 'apple' as const, userId: user.id, mockCredentials: readiness.apple.mockCredentials });
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
    const userDoc = await loadWalletPassUserFromDoc(payload.sub, { username: payload.username });
    const user = mergeWalletPassUserFromToken(userDoc, payload);

    const buffer = await generateAppleBusinessCardPass(user);
    const cpid = String(user.culturePassId ?? user.id).replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `CulturePass-ID-${cpid || 'member'}.pkpass`;
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
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
      return walletNotReadyResponse(res, 'google', readiness.googleBusinessCard.missing);
    }
    const user = await loadWalletPassUser(req);
    const url = await createGoogleBusinessCardSaveUrl(user);
    return res.json({
      url,
      provider: 'google' as const,
      userId: user.id,
      mockCredentials: readiness.googleBusinessCard.mockCredentials,
    });
  } catch (err) {
    captureRouteError(err, 'GET /wallet/business-card/google');
    return res.status(500).json({ error: 'Failed to create Google Wallet link' });
  }
});

/** Consolidated Digital ID bundle for /profile/qr (user, passes, wallet readiness, brand). */
walletRouter.get('/wallet/digital-id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const summary = await buildDigitalIdSummary(userId);
    return res.json(summary);
  } catch (err) {
    captureRouteError(err, 'GET /wallet/digital-id');
    return res.status(500).json({ error: 'Failed to load digital ID' });
  }
});

/** Authenticated readiness for profile/qr UI (no secret details). */
walletRouter.get('/wallet/business-card/readiness', requireAuth, (_req: Request, res: Response) => {
  const r = getWalletPassReadiness();
  return res.json({
    apple: r.apple.ready,
    google: r.googleBusinessCard.ready,
    mockCredentials: r.mockCredentials,
    publicOrigin: r.publicOrigin,
  });
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
    const ready = r.apple.ready
      && r.googleBusinessCard.ready
      && !r.apple.mockCredentials
      && !r.googleBusinessCard.mockCredentials;
    return res.json({
      success: true,
      ready,
      apple: r.apple,
      google: r.google,
      googleBusinessCard: r.googleBusinessCard,
      mockCredentials: r.mockCredentials,
      publicOrigin: r.publicOrigin,
    });
  },
);

// ─── Apple PassKit Web Service (pass updates / device registration) ─────────

function readApplePassAuth(req: Request, serialNumber: string): boolean {
  return verifyApplePassAuthorizationHeader(req.get('authorization') ?? undefined, serialNumber);
}

walletRouter.post(
  '/wallet/apple/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber',
  async (req: Request, res: Response) => {
    try {
      const serialNumber = qparam(req.params.serialNumber);
      const passTypeIdentifier = qparam(req.params.passTypeIdentifier);
      if (passTypeIdentifier !== getApplePassTypeIdentifier()) {
        return res.status(404).send('Unknown pass type');
      }
      if (!readApplePassAuth(req, serialNumber)) {
        return res.status(401).send('Unauthorized');
      }
      const pushToken = String((req.body as { pushToken?: string })?.pushToken ?? '').trim();
      if (!pushToken) return res.status(400).send('Missing pushToken');

      await registerDeviceForPass({
        deviceLibraryIdentifier: qparam(req.params.deviceLibraryIdentifier),
        passTypeIdentifier,
        serialNumber,
        pushToken,
      });
      return res.status(201).send();
    } catch (err) {
      captureRouteError(err, 'POST Apple PassKit device registration');
      return res.status(500).send('Registration failed');
    }
  },
);

walletRouter.delete(
  '/wallet/apple/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber',
  async (req: Request, res: Response) => {
    try {
      const serialNumber = qparam(req.params.serialNumber);
      if (!readApplePassAuth(req, serialNumber)) {
        return res.status(401).send('Unauthorized');
      }
      await unregisterDeviceForPass({
        deviceLibraryIdentifier: qparam(req.params.deviceLibraryIdentifier),
        passTypeIdentifier: qparam(req.params.passTypeIdentifier),
        serialNumber,
      });
      return res.status(200).send();
    } catch (err) {
      captureRouteError(err, 'DELETE Apple PassKit device registration');
      return res.status(500).send('Unregister failed');
    }
  },
);

walletRouter.get(
  '/wallet/apple/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier',
  async (req: Request, res: Response) => {
    try {
      const passTypeIdentifier = qparam(req.params.passTypeIdentifier);
      if (passTypeIdentifier !== getApplePassTypeIdentifier()) {
        return res.status(404).json({ serialNumbers: [] });
      }
      const passesUpdatedSince = String(req.query.passesUpdatedSince ?? '').trim() || null;
      const result = await listSerialNumbersForDevice({
        deviceLibraryIdentifier: qparam(req.params.deviceLibraryIdentifier),
        passTypeIdentifier,
        passesUpdatedSince,
      });
      if (result.serialNumbers.length === 0) {
        return res.status(204).send();
      }
      if (result.lastUpdated) {
        res.setHeader('Last-Modified', new Date(result.lastUpdated).toUTCString());
      }
      return res.json({ lastUpdated: result.lastUpdated, serialNumbers: result.serialNumbers });
    } catch (err) {
      captureRouteError(err, 'GET Apple PassKit device registrations');
      return res.status(500).json({ serialNumbers: [] });
    }
  },
);

walletRouter.get(
  '/wallet/apple/v1/passes/:passTypeIdentifier/:serialNumber',
  async (req: Request, res: Response) => {
    try {
      const readiness = getWalletPassReadiness();
      if (!readiness.apple.ready) return res.status(503).send('Apple Wallet not configured');

      const serialNumber = qparam(req.params.serialNumber);
      const passTypeIdentifier = qparam(req.params.passTypeIdentifier);
      if (passTypeIdentifier !== getApplePassTypeIdentifier()) {
        return res.status(404).send('Unknown pass type');
      }
      if (!readApplePassAuth(req, serialNumber)) {
        return res.status(401).send('Unauthorized');
      }

      const ifModifiedSince = req.get('if-modified-since');
      if (ifModifiedSince) {
        return res.status(304).send();
      }

      if (serialNumber.startsWith('cp-card-')) {
        const userId = resolveUserIdFromApplePassSerial(serialNumber);
        if (!userId) return res.status(404).send('Unknown pass');
        const user = await loadWalletPassUserFromDoc(userId);
        const buffer = await generateAppleBusinessCardPass(user);
        res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
        res.setHeader('Last-Modified', new Date().toUTCString());
        return res.send(buffer);
      }

      if (serialNumber.startsWith('cp-ticket-')) {
        const ticketId = serialNumber.slice('cp-ticket-'.length);
        const ticket = await ticketsService.getById(ticketId);
        if (!ticket) return res.status(404).send('Unknown pass');
        const event = ticket.eventId ? await eventsService.getById(ticket.eventId) : null;
        const walletTicket: WalletTicketInput = {
          id: ticket.id,
          eventId: ticket.eventId,
          userId: ticket.userId,
          status: ticket.status,
          paymentStatus: ticket.paymentStatus,
          tierName: ticket.tierName,
          qrCode: ticket.qrCode,
          cpTicketId: ticket.cpTicketId ?? ticket.qrCode,
          eventTitle: ticket.eventTitle,
          eventDate: ticket.eventDate,
          eventVenue: ticket.eventVenue,
        };
        const buffer = await generateAppleEventTicketPass(walletTicket, event);
        res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
        res.setHeader('Last-Modified', new Date().toUTCString());
        return res.send(buffer);
      }

      return res.status(404).send('Unknown pass');
    } catch (err) {
      captureRouteError(err, 'GET Apple PassKit pass update');
      return res.status(500).send('Pass update failed');
    }
  },
);

walletRouter.post('/wallet/apple/v1/log', async (req: Request, res: Response) => {
  // Apple devices POST diagnostic logs — acknowledge to avoid retries.
  const logs = (req.body as { logs?: string[] })?.logs;
  if (Array.isArray(logs) && logs.length > 0) {
    console.info('[Apple PassKit log]', logs.slice(0, 5).join(' | '));
  }
  return res.status(200).send();
});