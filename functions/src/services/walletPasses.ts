import type { Request } from 'express';
import { PKPass } from 'passkit-generator';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import { createHmac, randomUUID } from 'node:crypto';

export type WalletPassUser = {
  id: string;
  username?: string;
  displayName?: string;
  email?: string;
  city?: string;
  country?: string;
  culturePassId?: string;
  tier?: string; // free | plus | elite | pro | premium | vip etc. for themed Wallet passes
};

type AppleBusinessCardTokenPayload = {
  kind: 'apple-business-card';
  sub: string;
  username: string;
};

type AppleEventTicketTokenPayload = {
  kind: 'apple-event-ticket';
  sub: string;
  ticketId: string;
};

type AppleCertificates = {
  wwdr: string;
  signerCert: string;
  signerKey: string;
  signerKeyPassphrase?: string;
};

const TRANSPARENT_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO0fXfQAAAAASUVORK5CYII=';
const TRANSPARENT_PNG_BUFFER = Buffer.from(TRANSPARENT_PNG_BASE64, 'base64');
const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_WALLET_BASE_URL = 'https://walletobjects.googleapis.com/walletobjects/v1';

function getEnvVal(name: string): string {
  const envMap = new Map(Object.entries(process.env));
  return envMap.get(name) ?? '';
}

function envRequired(name: string): string {
  const value = getEnvVal(name).trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function normalizePem(value: string): string {
  const raw = value.trim();
  if (!raw) return raw;

  // Support escaped newlines from .env style values.
  if (raw.includes('\\n')) return raw.replace(/\\n/g, '\n');

  // Support plain base64 encoded PEM values.
  if (!raw.includes('BEGIN')) {
    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      if (decoded.includes('BEGIN')) return decoded;
    } catch {
      // ignore and return original value
    }
  }

  return raw;
}

function envOptional(name: string): string | undefined {
  const value = getEnvVal(name).trim();
  return value || undefined;
}

/**
 * Public web origin for universal links / marketing (ticket page, profile, hosted assets).
 * Set `PUBLIC_APP_ORIGIN` on Cloud Functions when it differs from the default.
 */
function getPublicAppOrigin(): string {
  return (envOptional('PUBLIC_APP_ORIGIN') ?? 'https://culturepass.app').replace(/\/$/, '');
}

function publicAppIconUrl(): string {
  const custom = envOptional('PUBLIC_APP_ICON_URL');
  if (custom) return custom;
  return `${getPublicAppOrigin()}/icon.png`;
}

/**
 * Origin used in signed Wallet *download* links (Safari → .pkpass). Prefer your stable HTTPS
 * domain (Firebase Hosting → Functions), not the raw `cloudfunctions.net` host, so links stay
 * valid and match `APPLE_PASS_WEBSERVICE_URL` / app deep links.
 */
function normalizeWalletLinksOrigin(raw: string): string {
  let s = raw.trim().replace(/\/$/, '');
  if (s.endsWith('/api')) s = s.slice(0, -4).replace(/\/$/, '');
  return s;
}

function resolveWalletPassDownloadOrigin(req: Request): string {
  const fromEnv = envOptional('WALLET_LINKS_PUBLIC_ORIGIN');
  if (fromEnv) return normalizeWalletLinksOrigin(fromEnv);
  return getPublicBaseUrl(req);
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function getPublicBaseUrl(req: Request): string {
  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const proto = forwardedProto || req.protocol || 'https';
  const host = req.get('x-forwarded-host') || req.get('host');
  if (!host) throw new Error('Unable to determine request host');
  return `${proto}://${host}`;
}

function getAppleCertificates(): AppleCertificates {
  return {
    wwdr: normalizePem(envRequired('APPLE_WWDR_CERT_PEM')),
    signerCert: normalizePem(envRequired('APPLE_PASS_SIGNER_CERT_PEM')),
    signerKey: normalizePem(envRequired('APPLE_PASS_SIGNER_KEY_PEM')),
    signerKeyPassphrase: String(process.env.APPLE_PASS_SIGNER_KEY_PASSPHRASE ?? '').trim() || undefined,
  };
}

function buildProfileUrl(username: string): string {
  return `${getPublicAppOrigin()}/u/${encodeURIComponent(username)}`;
}

export function buildApplePassSerialNumber(userId: string): string {
  return `cp-card-${userId}`;
}

export function resolveUserIdFromApplePassSerial(serialNumber: string): string | null {
  if (!serialNumber.startsWith('cp-card-')) return null;
  const userId = serialNumber.slice('cp-card-'.length).trim();
  return userId || null;
}

export function getApplePassTypeIdentifier(): string {
  return envRequired('APPLE_PASS_TYPE_IDENTIFIER');
}

function getApplePassAuthSecret(): string {
  return envOptional('APPLE_PASS_AUTH_TOKEN_SECRET') ?? envRequired('WALLET_LINK_SIGNING_SECRET');
}

export function getApplePassAuthenticationToken(serialNumber: string): string {
  const digest = createHmac('sha256', getApplePassAuthSecret()).update(serialNumber).digest('hex');
  return digest.slice(0, 32);
}

export function verifyApplePassAuthorizationHeader(authorizationHeader: string | undefined, serialNumber: string): boolean {
  if (!authorizationHeader) return false;
  const [scheme, token] = authorizationHeader.trim().split(/\s+/);
  if (scheme !== 'ApplePass' || !token) return false;
  return token === getApplePassAuthenticationToken(serialNumber);
}

function buildAppleDownloadToken(user: WalletPassUser): string {
  const secret = envRequired('WALLET_LINK_SIGNING_SECRET');
  const username = String(user.username ?? user.id);
  const payload: AppleBusinessCardTokenPayload = {
    kind: 'apple-business-card',
    sub: user.id,
    username,
  };
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: '10m',
  });
}

export function verifyAppleDownloadToken(token: string): AppleBusinessCardTokenPayload {
  const secret = envRequired('WALLET_LINK_SIGNING_SECRET');
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
  if (!decoded || typeof decoded !== 'object') {
    throw new Error('Invalid token payload');
  }
  if (decoded.kind !== 'apple-business-card') {
    throw new Error('Unexpected token kind');
  }
  return decoded as AppleBusinessCardTokenPayload;
}

export function createAppleBusinessCardSessionUrl(req: Request, user: WalletPassUser): string {
  const token = buildAppleDownloadToken(user);
  const base = resolveWalletPassDownloadOrigin(req);
  return `${base}/api/wallet/business-card/apple/pass?token=${encodeURIComponent(token)}`;
}

type GoogleServiceAccountConfig = {
  issuerId: string;
  classId: string;
  serviceAccountEmail: string;
  privateKey: string;
};

function getGoogleWalletConfig(): GoogleServiceAccountConfig {
  const issuerId = envRequired('GOOGLE_WALLET_ISSUER_ID');
  const serviceAccountEmail = envRequired('GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL');
  const privateKey = normalizePem(envRequired('GOOGLE_WALLET_PRIVATE_KEY'));
  const classIdRaw = envRequired('GOOGLE_WALLET_GENERIC_CLASS_ID');
  const classId = classIdRaw.includes('.') ? classIdRaw : `${issuerId}.${classIdRaw}`;
  return { issuerId, classId, serviceAccountEmail, privateKey };
}

async function getGoogleAccessToken(config: GoogleServiceAccountConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: config.serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/wallet_object',
      aud: GOOGLE_OAUTH_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    },
    config.privateKey,
    { algorithm: 'RS256' }
  );

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google OAuth token request failed: ${response.status} ${text}`);
  }
  const json = await response.json() as { access_token?: string };
  if (!json.access_token) throw new Error('Google OAuth token response missing access_token');
  return json.access_token;
}

async function getGoogleGenericClass(accessToken: string, classId: string): Promise<Response> {
  return fetch(`${GOOGLE_WALLET_BASE_URL}/genericClass/${encodeURIComponent(classId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function bootstrapGoogleBusinessCardClass(): Promise<{ classId: string; created: boolean }> {
  const config = getGoogleWalletConfig();
  const accessToken = await getGoogleAccessToken(config);

  const existingResponse = await getGoogleGenericClass(accessToken, config.classId);
  if (existingResponse.ok) {
    return { classId: config.classId, created: false };
  }
  if (existingResponse.status !== 404) {
    const errorText = await existingResponse.text();
    throw new Error(`Google Wallet class lookup failed: ${existingResponse.status} ${errorText}`);
  }

  const createResponse = await fetch(`${GOOGLE_WALLET_BASE_URL}/genericClass`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: config.classId,
      issuerName: 'CulturePass',
      reviewStatus: 'UNDER_REVIEW',
      hexBackgroundColor: '#4F46E5',
      homepageUri: {
        uri: getPublicAppOrigin(),
        description: 'CulturePass',
      },
      logo: {
        sourceUri: {
          uri: publicAppIconUrl(),
        },
        contentDescription: {
          defaultValue: { language: 'en-AU', value: 'CulturePass logo' },
        },
      },
      classTemplateInfo: {
        cardTemplateOverride: {
          cardRowTemplateInfos: [
            {
              twoItems: {
                startItem: { firstValue: { fields: [{ fieldPath: "object.textModulesData['city-country']" }] } },
                endItem: { firstValue: { fields: [{ fieldPath: "object.textModulesData['profile']" }] } },
              },
            },
          ],
        },
      },
    }),
  });
  if (!createResponse.ok) {
    const text = await createResponse.text();
    throw new Error(`Google Wallet class creation failed: ${createResponse.status} ${text}`);
  }
  return { classId: config.classId, created: true };
}

export async function createGoogleBusinessCardSaveUrl(user: WalletPassUser): Promise<string> {
  const config = getGoogleWalletConfig();
  const username = String(user.username ?? user.id);
  const displayName = String(user.displayName ?? username);
  const objectId = `${config.issuerId}.${slugify(`${username}-${randomUUID()}`).slice(0, 48)}`;
  const profileUrl = buildProfileUrl(username);
  const tier = (user.tier || 'free').toLowerCase();

  // Tier-aware colors for Google Wallet (match Apple + brand)
  const tierBg: Record<string, string> = {
    elite: '#0F0F0F',
    vip: '#0F0A02',
    premium: '#1A0F0A',
    plus: '#1E1B4B',
    pro: '#061F2E',
    free: '#1C1917',
  };
  const bgColor = tierBg[tier] || '#1C1917';
  const tierLabel = tier === 'elite' ? 'ELITE MEMBER' : tier === 'vip' ? 'VIP MEMBER' : tier === 'plus' || tier === 'premium' ? 'PLUS MEMBER' : tier === 'pro' ? 'PRO MEMBER' : 'STANDARD MEMBER';

  const payload = {
    genericObjects: [
      {
        id: objectId,
        classId: config.classId,
        state: 'ACTIVE',
        hexBackgroundColor: bgColor,
        cardTitle: {
          defaultValue: { language: 'en-AU', value: 'CulturePass' },
        },
        header: {
          defaultValue: { language: 'en-AU', value: displayName },
        },
        subheader: {
          defaultValue: { language: 'en-AU', value: `${user.culturePassId ?? `@${username}`} · ${tierLabel}` },
        },
        barcode: {
          type: 'QR_CODE',
          value: profileUrl,
          alternateText: user.culturePassId ?? profileUrl,
        },
        textModulesData: [
          {
            id: 'membership',
            header: 'Membership',
            body: tierLabel,
          },
          {
            id: 'city-country',
            header: 'Location',
            body: [user.city, user.country].filter(Boolean).join(', ') || 'Global',
          },
          {
            id: 'profile',
            header: 'Profile',
            body: profileUrl,
          },
        ],
        linksModuleData: {
          uris: [{ id: 'open-profile', uri: profileUrl, description: 'Open CulturePass profile' }],
        },
      },
    ],
  };

  const claims = {
    iss: config.serviceAccountEmail,
    aud: 'google',
    typ: 'savetowallet',
    payload,
  };

  const token = jwt.sign(claims, config.privateKey, { algorithm: 'RS256' });
  return `https://pay.google.com/gp/v/save/${token}`;
}

async function renderBrandAsset(width: number, height: number): Promise<Buffer> {
  const fontSize = Math.max(14, Math.round(Math.min(width, height) * 0.35));
  const svg =
    '<svg width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
    '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#4F46E5"/>' +
    '<stop offset="60%" stop-color="#FFCC00"/>' +
    '<stop offset="100%" stop-color="#FF5E5B"/>' +
    '</linearGradient>' +
    '</defs>' +
    '<rect x="0" y="0" width="' + width + '" height="' + height + '" rx="' + Math.floor(width * 0.2) + '" fill="url(#g)" />' +
    '<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="' + fontSize + '" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#FFFFFF">CP</text>' +
    '</svg>';

  try {
    return await sharp(Buffer.from(svg)).png().toBuffer();
  } catch {
    return TRANSPARENT_PNG_BUFFER;
  }
}

export async function generateAppleBusinessCardPass(user: WalletPassUser): Promise<Buffer> {
  const passTypeIdentifier = envRequired('APPLE_PASS_TYPE_IDENTIFIER');
  const teamIdentifier = envRequired('APPLE_TEAM_IDENTIFIER');
  const certificates = getAppleCertificates();

  const username = String(user.username ?? user.id);
  const displayName = String(user.displayName ?? username);
  const profileUrl = buildProfileUrl(username);
  const culturePassId = String(user.culturePassId ?? `CP-${user.id}`);
  const tier = (user.tier || 'free').toLowerCase();
  const serialNumber = buildApplePassSerialNumber(user.id);
  const authenticationToken = getApplePassAuthenticationToken(serialNumber);
  const webServiceBaseUrl =
    envOptional('APPLE_PASS_WEBSERVICE_URL') ?? `${getPublicAppOrigin()}/api/wallet/apple/v1`;
  const icon = await renderBrandAsset(58, 58);
  const icon2x = await renderBrandAsset(116, 116);
  const logo = await renderBrandAsset(160, 50);
  const logo2x = await renderBrandAsset(320, 100);

  // Tier-themed colors for Apple Wallet pass (follows Apple HIG for contrast + brand)
  const tierStyles: Record<string, { bg: string; fg: string; label: string; tierLabel: string }> = {
    elite:   { bg: 'rgb(15,15,15)', fg: 'rgb(255,251,235)', label: 'rgb(212,160,23)', tierLabel: 'ELITE MEMBER' },
    vip:     { bg: 'rgb(15,10,2)', fg: 'rgb(255,251,235)', label: 'rgb(232,195,107)', tierLabel: 'VIP MEMBER' },
    premium: { bg: 'rgb(26,15,10)', fg: 'rgb(255,241,235)', label: 'rgb(242,192,120)', tierLabel: 'PREMIUM MEMBER' },
    plus:    { bg: 'rgb(30,27,75)', fg: 'rgb(255,240,240)', label: 'rgb(255,94,91)', tierLabel: 'PLUS MEMBER' },
    pro:     { bg: 'rgb(6,31,46)', fg: 'rgb(224,250,255)', label: 'rgb(0,240,255)', tierLabel: 'PRO MEMBER' },
    free:    { bg: 'rgb(28,25,23)', fg: 'rgb(245,245,244)', label: 'rgb(227,106,78)', tierLabel: 'STANDARD MEMBER' },
  };
  const style = tierStyles[tier] || tierStyles.free;
  const tierLabel = style.tierLabel;

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier,
    teamIdentifier,
    organizationName: 'CulturePass',
    description: 'CulturePass Digital Member ID — add to Wallet for events',
    logoText: 'CulturePass',
    authenticationToken,
    webServiceURL: webServiceBaseUrl,
    generic: {
      // Use generic for flexible membership ID layout (recommended by Apple for custom digital IDs)
    },
  };

  const pass = new PKPass(
    {
      'pass.json': Buffer.from(JSON.stringify(passJson), 'utf8'),
      'icon.png': icon,
      'icon@2x.png': icon2x,
      'logo.png': logo,
      'logo@2x.png': logo2x,
    },
    certificates,
    {
      serialNumber,
      description: 'CulturePass Digital Member ID',
      organizationName: 'CulturePass',
      backgroundColor: style.bg,
      foregroundColor: style.fg,
      labelColor: style.label,
    }
  );

  // Prominent tier header
  pass.headerFields.push({
    key: 'tier',
    label: 'CULTUREPASS',
    value: tierLabel,
  });

  pass.primaryFields.push({
    key: 'member_name',
    label: 'MEMBER',
    value: displayName,
  });

  pass.secondaryFields.push({
    key: 'culturepass_id',
    label: 'CPID',
    value: culturePassId,
  });

  pass.auxiliaryFields.push({
    key: 'username',
    label: 'HANDLE',
    value: `@${username}`,
  });

  // Back fields for full details (visible when user flips the pass in Wallet)
  pass.backFields.push({
    key: 'profile_url',
    label: 'PROFILE',
    value: profileUrl,
  });
  pass.backFields.push({
    key: 'location',
    label: 'LOCATION',
    value: [user.city, user.country].filter(Boolean).join(', ') || 'Global',
  });
  pass.backFields.push({
    key: 'tier_detail',
    label: 'MEMBERSHIP',
    value: tierLabel,
  });

  // Barcode / QR points to public profile (scannable from Wallet)
  pass.setBarcodes(profileUrl);

  return pass.getAsBuffer();
}

// ─── Event ticket passes (Apple Wallet + Google Wallet) ─────────────────────

export type WalletTicketInput = {
  id: string;
  eventId: string;
  userId: string;
  status: string;
  paymentStatus?: string;
  tierName?: string;
  qrCode: string;
  cpTicketId: string;
  eventTitle?: string;
  eventDate?: string;
  eventVenue?: string;
};

export type WalletEventSnapshot = {
  title?: string;
  date?: string;
  time?: string;
  venue?: string;
};

export function buildAppleTicketSerialNumber(ticketId: string): string {
  return `cp-ticket-${ticketId}`;
}

export function buildAppleTicketDownloadToken(userId: string, ticketId: string): string {
  const secret = envRequired('WALLET_LINK_SIGNING_SECRET');
  const payload: AppleEventTicketTokenPayload = {
    kind: 'apple-event-ticket',
    sub: userId,
    ticketId,
  };
  return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '10m' });
}

export function verifyAppleTicketDownloadToken(token: string): AppleEventTicketTokenPayload {
  const secret = envRequired('WALLET_LINK_SIGNING_SECRET');
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
  if (!decoded || typeof decoded !== 'object') {
    throw new Error('Invalid token payload');
  }
  if ((decoded as AppleEventTicketTokenPayload).kind !== 'apple-event-ticket') {
    throw new Error('Unexpected token kind');
  }
  return decoded as AppleEventTicketTokenPayload;
}

export function createAppleTicketPassSessionUrl(req: Request, userId: string, ticketId: string): string {
  const token = buildAppleTicketDownloadToken(userId, ticketId);
  const base = resolveWalletPassDownloadOrigin(req);
  return `${base}/api/tickets/${encodeURIComponent(ticketId)}/wallet/apple/pass?token=${encodeURIComponent(token)}`;
}

function formatTicketWhen(event: WalletEventSnapshot | null, ticket: WalletTicketInput): string {
  const date = event?.date ?? ticket.eventDate;
  const time = event?.time;
  if (!date) return 'Date TBA';
  const t = time?.trim().length ? time.trim() : '00:00';
  const parsed = new Date(`${date}T${t.length === 5 ? t : '00:00'}:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getGoogleTicketClassId(): string {
  const issuerId = envRequired('GOOGLE_WALLET_ISSUER_ID');
  const raw = envOptional('GOOGLE_WALLET_TICKET_CLASS_ID') ?? 'culturepass_event_ticket';
  return raw.includes('.') ? raw : `${issuerId}.${raw}`;
}

async function ensureGoogleEventTicketClass(): Promise<string> {
  const classId = getGoogleTicketClassId();
  const issuerId = envRequired('GOOGLE_WALLET_ISSUER_ID');
  const serviceAccountEmail = envRequired('GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL');
  const privateKey = normalizePem(envRequired('GOOGLE_WALLET_PRIVATE_KEY'));
  const accessToken = await getGoogleAccessToken({
    issuerId,
    classId: '',
    serviceAccountEmail,
    privateKey,
  });

  const existingResponse = await getGoogleGenericClass(accessToken, classId);
  if (existingResponse.ok) {
    return classId;
  }
  if (existingResponse.status !== 404) {
    const errorText = await existingResponse.text();
    throw new Error(`Google Wallet ticket class lookup failed: ${existingResponse.status} ${errorText}`);
  }

  const createResponse = await fetch(`${GOOGLE_WALLET_BASE_URL}/genericClass`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: classId,
      issuerName: 'CulturePass',
      reviewStatus: 'UNDER_REVIEW',
      hexBackgroundColor: '#0B0B14',
      homepageUri: {
        uri: getPublicAppOrigin(),
        description: 'CulturePass',
      },
      logo: {
        sourceUri: {
          uri: publicAppIconUrl(),
        },
        contentDescription: {
          defaultValue: { language: 'en-AU', value: 'CulturePass logo' },
        },
      },
    }),
  });
  if (!createResponse.ok) {
    const text = await createResponse.text();
    throw new Error(`Google Wallet ticket class creation failed: ${createResponse.status} ${text}`);
  }
  return classId;
}

export async function createGoogleEventTicketSaveUrl(
  ticket: WalletTicketInput,
  event: WalletEventSnapshot | null,
): Promise<string> {
  const classId = await ensureGoogleEventTicketClass();
  const issuerId = envRequired('GOOGLE_WALLET_ISSUER_ID');
  const serviceAccountEmail = envRequired('GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL');
  const privateKey = normalizePem(envRequired('GOOGLE_WALLET_PRIVATE_KEY'));

  const eventTitle = event?.title ?? ticket.eventTitle ?? 'CulturePass Event';
  const venue = event?.venue ?? ticket.eventVenue ?? 'Venue TBA';
  const when = formatTicketWhen(event, ticket);
  const ticketPageUrl = `${getPublicAppOrigin()}/tickets/${encodeURIComponent(ticket.id)}`;
  const scanPayload = ticket.cpTicketId || ticket.qrCode;

  const objectId = `${issuerId}.${slugify(`ticket-${ticket.id}-${randomUUID()}`).slice(0, 48)}`;

  const payload = {
    genericObjects: [
      {
        id: objectId,
        classId,
        state: 'ACTIVE',
        hexBackgroundColor: '#0B0B14',
        cardTitle: {
          defaultValue: { language: 'en-AU', value: 'CulturePass Ticket' },
        },
        header: {
          defaultValue: { language: 'en-AU', value: eventTitle },
        },
        subheader: {
          defaultValue: { language: 'en-AU', value: when },
        },
        barcode: {
          type: 'QR_CODE',
          value: scanPayload,
          alternateText: ticket.cpTicketId,
        },
        textModulesData: [
          {
            id: 'venue',
            header: 'Venue',
            body: venue,
          },
          {
            id: 'ticket-code',
            header: 'Ticket code',
            body: ticket.cpTicketId,
          },
          {
            id: 'tier',
            header: 'Tier',
            body: ticket.tierName ?? 'General',
          },
        ],
        linksModuleData: {
          uris: [{ id: 'open-ticket', uri: ticketPageUrl, description: 'Open ticket in CulturePass' }],
        },
      },
    ],
  };

  const claims = {
    iss: serviceAccountEmail,
    aud: 'google',
    typ: 'savetowallet',
    payload,
  };

  const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' });
  return `https://pay.google.com/gp/v/save/${token}`;
}

export async function generateAppleEventTicketPass(
  ticket: WalletTicketInput,
  event: WalletEventSnapshot | null,
): Promise<Buffer> {
  const passTypeIdentifier = envRequired('APPLE_PASS_TYPE_IDENTIFIER');
  const teamIdentifier = envRequired('APPLE_TEAM_IDENTIFIER');
  const certificates = getAppleCertificates();

  const eventTitle = event?.title ?? ticket.eventTitle ?? 'CulturePass Event';
  const venue = event?.venue ?? ticket.eventVenue ?? 'Venue TBA';
  const when = formatTicketWhen(event, ticket);
  const serialNumber = buildAppleTicketSerialNumber(ticket.id);
  const authenticationToken = getApplePassAuthenticationToken(serialNumber);
  const webServiceBaseUrl =
    envOptional('APPLE_PASS_WEBSERVICE_URL') ?? `${getPublicAppOrigin()}/api/wallet/apple/v1`;
  const ticketPageUrl = `${getPublicAppOrigin()}/tickets/${encodeURIComponent(ticket.id)}`;

  const icon = await renderBrandAsset(58, 58);
  const icon2x = await renderBrandAsset(116, 116);
  const logo = await renderBrandAsset(160, 50);
  const logo2x = await renderBrandAsset(320, 100);

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier,
    teamIdentifier,
    organizationName: 'CulturePass',
    description: eventTitle,
    logoText: 'CulturePass',
    authenticationToken,
    webServiceURL: webServiceBaseUrl,
    eventTicket: {},
  };

  const pass = new PKPass(
    {
      'pass.json': Buffer.from(JSON.stringify(passJson), 'utf8'),
      'icon.png': icon,
      'icon@2x.png': icon2x,
      'logo.png': logo,
      'logo@2x.png': logo2x,
    },
    certificates,
    {
      serialNumber,
      description: eventTitle,
      organizationName: 'CulturePass',
      backgroundColor: 'rgb(11,11,20)',
      foregroundColor: 'rgb(255,255,255)',
      labelColor: 'rgb(230,200,92)',
    }
  );

  pass.primaryFields.push({
    key: 'event_name',
    label: 'EVENT',
    value: eventTitle,
  });
  pass.secondaryFields.push({
    key: 'date_time',
    label: 'WHEN',
    value: when,
  });
  pass.auxiliaryFields.push({
    key: 'venue',
    label: 'VENUE',
    value: venue,
  });
  pass.auxiliaryFields.push({
    key: 'ticket_code',
    label: 'CODE',
    value: ticket.cpTicketId,
  });
  pass.backFields.push({
    key: 'tier',
    label: 'TIER',
    value: ticket.tierName ?? 'General',
  });
  pass.backFields.push({
    key: 'status',
    label: 'STATUS',
    value: ticket.status,
  });
  pass.backFields.push({
    key: 'ticket_url',
    label: 'TICKET',
    value: ticketPageUrl,
  });
  pass.setBarcodes(ticket.cpTicketId || ticket.qrCode);

  return pass.getAsBuffer();
}

const APPLE_WALLET_REQUIRED = [
  'APPLE_WWDR_CERT_PEM',
  'APPLE_PASS_SIGNER_CERT_PEM',
  'APPLE_PASS_SIGNER_KEY_PEM',
  'APPLE_PASS_TYPE_IDENTIFIER',
  'APPLE_TEAM_IDENTIFIER',
  'WALLET_LINK_SIGNING_SECRET',
] as const;

const GOOGLE_WALLET_CORE = [
  'GOOGLE_WALLET_ISSUER_ID',
  'GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_WALLET_PRIVATE_KEY',
] as const;

const GOOGLE_WALLET_BUSINESS_CARD_EXTRA = ['GOOGLE_WALLET_GENERIC_CLASS_ID'] as const;

export function getWalletPassReadiness(): {
  apple: { ready: boolean; missing: string[] };
  /** Enough to issue event tickets + create ticket Generic class. */
  google: { ready: boolean; missing: string[] };
  /** Includes Generic class id required for the member business card save URL. */
  googleBusinessCard: { ready: boolean; missing: string[] };
} {
  const appleMissing = APPLE_WALLET_REQUIRED.filter((k) => !getEnvVal(k).trim());
  const googleCoreMissing = GOOGLE_WALLET_CORE.filter((k) => !getEnvVal(k).trim());
  const googleBusinessMissing = [
    ...googleCoreMissing,
    ...GOOGLE_WALLET_BUSINESS_CARD_EXTRA.filter((k) => !getEnvVal(k).trim()),
  ];
  return {
    apple: { ready: appleMissing.length === 0, missing: appleMissing },
    google: { ready: googleCoreMissing.length === 0, missing: googleCoreMissing },
    googleBusinessCard: { ready: googleBusinessMissing.length === 0, missing: googleBusinessMissing },
  };
}
