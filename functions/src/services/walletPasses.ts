import type { Request } from 'express';
import { PKPass } from 'passkit-generator';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import { createHmac, randomUUID } from 'node:crypto';
import { storageBucket } from '../admin';

export type WalletPassUser = {
  id: string;
  username?: string;
  displayName?: string;
  email?: string;
  city?: string;
  country?: string;
  culturePassId?: string;
  tier?: string; // free | plus | elite | pro | premium | vip etc. for themed Wallet passes
  avatarUrl?: string;
  createdAt?: string;
  affiliationName?: string;
};

type AppleBusinessCardTokenPayload = {
  kind: 'apple-business-card';
  sub: string;
  username: string;
  displayName?: string;
  culturePassId?: string;
  tier?: string;
  avatarUrl?: string;
  createdAt?: string;
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

/** CulturePass wallet — full cyan member pass with white typography. */
const WALLET_BRAND_CYAN = 'rgb(0, 173, 239)';
const WALLET_CARD = {
  appleBackground: 'rgb(0, 173, 239)',
  appleForeground: 'rgb(255, 255, 255)',
  appleLabel: 'rgb(255, 255, 255)',
  googleHex: '#00ADEF',
  passRevision: '2026-06-09-v9',
  avatarIndigo: '#4F46E5',
  // New branding colors for enhanced visual identity
  terracotta: '#E36A4E',      // Primary terracotta glow
  saffron: '#F5A623',         // Secondary saffron gold
  indigo: '#4A5EBF',          // Accent indigo
  emerald: '#0A8C7F',         // Accent emerald
  gold: '#D4A017',            // Heritage gold highlight
} as const;

function formatWalletDisplayName(name: string, fallback: string): string {
  const trimmed = String(name ?? '').trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function formatWalletMemberSince(createdAt?: string): string {
  if (!createdAt) return '—';
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
}

function walletPassInitials(name: string, fallback = 'U'): string {
  const source = String(name ?? '').trim() || fallback;
  return source.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatWalletTierLabel(tier: string): string {
  const key = (tier || 'free').toLowerCase();
  if (key === 'elite') return 'Elite';
  if (key === 'vip') return 'VIP';
  if (key === 'premium') return 'Premium';
  if (key === 'plus') return 'Plus';
  if (key === 'pro') return 'Pro';
  return 'Standard';
}

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

function buildProfileUrl(user: Pick<WalletPassUser, 'username' | 'id' | 'culturePassId'>): string {
  const cpid = String(user.culturePassId ?? '').trim().toUpperCase();
  if (/^CP-[A-Z0-9]{6,}$/.test(cpid)) {
    return `${getPublicAppOrigin()}/cpu/${encodeURIComponent(cpid)}`;
  }
  const username = String(user.username ?? user.id);
  return `${getPublicAppOrigin()}/cpu/${encodeURIComponent(username)}`;
}

function isMockAppleConfiguration(): boolean {
  // Local mock script uses the same self-signed cert for WWDR and signer.
  const signerCert = getEnvVal('APPLE_PASS_SIGNER_CERT_PEM').trim();
  const wwdrCert = getEnvVal('APPLE_WWDR_CERT_PEM').trim();
  return Boolean(signerCert && wwdrCert && signerCert === wwdrCert);
}

function isMockGoogleConfiguration(): boolean {
  const issuer = getEnvVal('GOOGLE_WALLET_ISSUER_ID').trim();
  const email = getEnvVal('GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL').trim();
  if (issuer === '1234567890123456789') return true;
  if (email.includes('local-mock@')) return true;
  return false;
}

/** True when any platform still uses local mock credentials. */
export function isMockWalletConfiguration(): boolean {
  return isMockAppleConfiguration() || isMockGoogleConfiguration();
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
    displayName: user.displayName,
    culturePassId: user.culturePassId,
    tier: user.tier,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: '10m',
  });
}

export function mergeWalletPassUserFromToken(user: WalletPassUser, token: AppleBusinessCardTokenPayload): WalletPassUser {
  return {
    ...user,
    username: token.username || user.username,
    displayName: token.displayName ?? user.displayName,
    culturePassId: token.culturePassId ?? user.culturePassId,
    tier: token.tier ?? user.tier,
    avatarUrl: token.avatarUrl ?? user.avatarUrl,
    createdAt: token.createdAt ?? user.createdAt,
  };
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
      sub: config.serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
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
      hexBackgroundColor: WALLET_CARD.googleHex,
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
                startItem: { firstValue: { fields: [{ fieldPath: "object.textModulesData['cpid']" }] } },
                endItem: { firstValue: { fields: [{ fieldPath: "object.textModulesData['membership']" }] } },
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
  const displayName = formatWalletDisplayName(user.displayName ?? '', username);
  const objectId = `${config.issuerId}.${slugify(`${username}-${randomUUID()}`).slice(0, 48)}`;
  const profileUrl = buildProfileUrl(user);
  const tierLabel = formatWalletTierLabel(user.tier || 'free');
  const culturePassId = String(user.culturePassId ?? `CP-${user.id}`);
  const memberSince = formatWalletMemberSince(user.createdAt);
  const qrPayload = buildWalletQrPayload(user);
  const location = [user.city, user.country].filter(Boolean).join(', ');

  const payload = {
    genericObjects: [
      {
        id: objectId,
        classId: config.classId,
        state: 'ACTIVE',
        hexBackgroundColor: WALLET_CARD.googleHex,
        cardTitle: {
          defaultValue: { language: 'en-AU', value: `CULTUREPASS ID · ${tierLabel.toUpperCase()}` },
        },
        header: {
          defaultValue: { language: 'en-AU', value: displayName },
        },
        subheader: {
          defaultValue: { language: 'en-AU', value: `@${username}` },
        },
        barcode: {
          type: 'QR_CODE',
          value: qrPayload,
          alternateText: culturePassId,
        },
        textModulesData: [
          {
            id: 'member_since',
            header: 'Member Since',
            body: memberSince,
          },
          {
            id: 'cpid',
            header: 'ID',
            body: culturePassId,
          },
          {
            id: 'membership',
            header: 'Tier',
            body: tierLabel,
          },
          ...(location ? [{
            id: 'location',
            header: 'Location',
            body: location,
          }] : []),
          ...(user.affiliationName ? [{
            id: 'affiliation',
            header: 'Affiliation',
            body: user.affiliationName,
          }] : []),
          {
            id: 'profile',
            header: 'Profile',
            body: profileUrl.replace(/^https?:\/\//, ''),
          },
        ],
        ...(user.avatarUrl ? {
          imageModulesData: [
            {
              id: 'avatar',
              mainImage: {
                sourceUri: { uri: user.avatarUrl },
                contentDescription: {
                  defaultValue: { language: 'en-AU', value: `${displayName} avatar` },
                },
              },
            },
          ],
        } : {}),
        linksModuleData: {
          uris: [{ id: 'open-profile', uri: profileUrl, description: 'View profile' }],
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

async function renderBrandAsset(width: number, height: number, onCyan = true): Promise<Buffer> {
  const fontSize = Math.max(14, Math.round(Math.min(width, height) * 0.34));
  const radius = Math.floor(Math.min(width, height) * 0.22);
  const bg = onCyan ? 'rgba(255,255,255,0.18)' : '#FFFFFF';
  const fg = onCyan ? '#FFFFFF' : '#00ADEF';
  const svg =
    '<svg width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="0" y="0" width="' + width + '" height="' + height + '" rx="' + radius + '" fill="' + bg + '" />' +
    '<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="' + fontSize + '" font-family="Arial, Helvetica, sans-serif" font-weight="800" fill="' + fg + '">CP</text>' +
    '</svg>';

  try {
    return await sharp(Buffer.from(svg)).png().toBuffer();
  } catch {
    return TRANSPARENT_PNG_BUFFER;
  }
}

async function renderWalletLogo(width: number, height: number, onDark = false): Promise<Buffer> {
  const fontSize = Math.max(11, Math.round(height * 0.44));
  const y = Math.round(height * 0.72);
  const svg = onDark
    ? '<svg width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg">' +
      '<text x="0" y="' + y + '" font-family="Arial, Helvetica, sans-serif" font-size="' + fontSize + '" font-weight="800" letter-spacing="0.8">' +
      '<tspan fill="#FFFFFF">CULTURE</tspan><tspan fill="#FFFFFF">PASS</tspan><tspan fill="#FFFFFF"> ID</tspan></text></svg>'
    : '<svg width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg">' +
      '<text x="0" y="' + y + '" font-family="Arial, Helvetica, sans-serif" font-size="' + fontSize + '" font-weight="800" letter-spacing="0.8">' +
      '<tspan fill="#E36A4E">CULTURE</tspan><tspan fill="#0A8C7F">PASS</tspan><tspan fill="#D4A017"> ID</tspan></text></svg>';

  try {
    return await sharp(Buffer.from(svg)).png().toBuffer();
  } catch {
    return renderBrandAsset(width, height);
  }
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function truncateText(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(1, max - 1))}…`;
}

export function buildWalletQrPayload(user: Pick<WalletPassUser, 'culturePassId' | 'displayName' | 'username' | 'id'>): string {
  const username = String(user.username ?? user.id);
  const displayName = formatWalletDisplayName(user.displayName ?? '', username);
  const culturePassId = String(user.culturePassId ?? `CP-${user.id}`);
  return JSON.stringify({ type: 'culturepass_id', cpid: culturePassId, name: displayName, username });
}

async function fetchRemoteBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'CulturePass-Wallet/1.0', Accept: 'image/*,*/*' },
    });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    await sharp(buffer).metadata();
    return buffer;
  } catch {
    return null;
  }
}

function parseFirebaseStorageObjectPath(url: string): string | null {
  if (!url.includes('firebasestorage.googleapis.com')) return null;
  const match = url.match(/\/o\/([^?]+)/);
  if (!match?.[1]) return null;
  return decodeURIComponent(match[1]);
}

async function fetchAvatarBufferFromStorage(url: string): Promise<Buffer | null> {
  if (!storageBucket) return null;
  const objectPath = parseFirebaseStorageObjectPath(url);
  if (!objectPath) return null;
  try {
    const [buffer] = await storageBucket.file(objectPath).download();
    await sharp(buffer).metadata();
    return buffer;
  } catch {
    return null;
  }
}

async function fetchAvatarBuffer(avatarUrl?: string): Promise<Buffer | null> {
  const url = String(avatarUrl ?? '').trim();
  if (!url) return null;

  if (url.includes('firebasestorage.googleapis.com')) {
    const fromAdmin = await fetchAvatarBufferFromStorage(url);
    if (fromAdmin) return fromAdmin;
  }

  const direct = await fetchRemoteBuffer(url);
  if (direct) return direct;

  if (url.includes('firebasestorage.googleapis.com') && url.includes('alt=media')) {
    const tokenless = url.replace(/([?&])token=[^&]+/i, '').replace(/[?&]$/, '');
    return fetchRemoteBuffer(tokenless);
  }
  return null;
}

async function renderCpLogoSquare(size: number): Promise<Buffer> {
  const fontSize = Math.max(8, Math.round(size * 0.42));
  const svg =
    '<svg width="' + size + '" height="' + size + '" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="' + size + '" height="' + size + '" rx="' + Math.round(size * 0.18) + '" fill="' + WALLET_CARD.terracotta + '"/>' +
    '<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="' + fontSize + '" font-weight="800" fill="#FFFFFF">CP</text>' +
    '</svg>';
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function fetchQrWithLogo(payload: string, qrSize: number): Promise<Buffer> {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&ecc=H&margin=0&data=${encodeURIComponent(payload)}`;
  const qrBuffer = await fetchRemoteBuffer(qrUrl);
  if (!qrBuffer) return TRANSPARENT_PNG_BUFFER;

  let qrImage: Buffer;
  try {
    qrImage = await sharp(qrBuffer).resize(qrSize, qrSize).png().toBuffer();
  } catch {
    return TRANSPARENT_PNG_BUFFER;
  }

  const logoSize = Math.max(12, Math.round(qrSize * 0.22));
  const logoPad = Math.max(2, Math.round(logoSize * 0.12));
  let logo: Buffer | null = null;

  const logoBuffer = await fetchRemoteBuffer(publicAppIconUrl());
  if (logoBuffer) {
    try {
      logo = await sharp(logoBuffer).resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toBuffer();
    } catch {
      logo = null;
    }
  }
  if (!logo) {
    logo = await renderCpLogoSquare(logoSize);
  }

  try {
    const logoLeft = Math.round((qrSize - logoSize) / 2);
    const logoTop = Math.round((qrSize - logoSize) / 2);
    const logoPlate = await sharp({
      create: {
        width: logoSize + logoPad * 2,
        height: logoSize + logoPad * 2,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const logoPlateWithIcon = await sharp(logoPlate)
      .composite([{ input: logo, top: logoPad, left: logoPad }])
      .png()
      .toBuffer();

    return sharp(qrImage)
      .composite([{ input: logoPlateWithIcon, top: logoTop - logoPad, left: logoLeft - logoPad }])
      .png()
      .toBuffer();
  } catch {
    return qrImage;
  }
}

function buildWalletBackFields(user: WalletPassUser, profileUrl: string, culturePassId: string, tierLabel: string, memberSince: string) {
  const username = String(user.username ?? user.id);
  const displayName = formatWalletDisplayName(user.displayName ?? '', username);
  const location = [user.city, user.country].filter(Boolean).join(', ');
  const fields: Array<{ key: string; label: string; value: string }> = [
    { key: 'member_name_back', label: 'NAME', value: displayName },
    { key: 'username_back', label: 'USERNAME', value: `@${username}` },
    { key: 'member_since_back', label: 'MEMBER SINCE', value: memberSince },
    { key: 'culturepass_id', label: 'ID', value: culturePassId },
    { key: 'membership', label: 'TIER', value: tierLabel },
  ];
  if (user.affiliationName) {
    fields.push({ key: 'affiliation', label: 'AFFILIATION', value: user.affiliationName });
  }
  if (location) {
    fields.push({ key: 'location', label: 'LOCATION', value: location });
  }
  fields.push({ key: 'profile_url', label: 'PROFILE', value: profileUrl.replace(/^https?:\/\//, '') });
  return fields;
}

async function applyCircleMask(buffer: Buffer, size: number): Promise<Buffer> {
  const mask = Buffer.from(
    '<svg width="' + size + '" height="' + size + '" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="' + (size / 2) + '" cy="' + (size / 2) + '" r="' + (size / 2) + '" fill="#fff"/></svg>'
  );
  return sharp(buffer).resize(size, size, { fit: 'cover' }).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

async function renderInitialsAvatarCircle(size: number, initials: string): Promise<Buffer> {
  const safe = initials.replace(/[<>&"']/g, '');
  const fontSize = Math.max(18, Math.round(size * 0.36));
  const svg =
    '<svg width="' + size + '" height="' + size + '" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="' + (size / 2) + '" cy="' + (size / 2) + '" r="' + (size / 2 - 1) + '" fill="#FFFFFF"/>' +
    '<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="' + fontSize + '" font-family="Arial,Helvetica,sans-serif" font-weight="800" fill="' + WALLET_CARD.avatarIndigo + '">' +
    safe +
    '</text></svg>';
  try {
    return await sharp(Buffer.from(svg)).png().toBuffer();
  } catch {
    return TRANSPARENT_PNG_BUFFER;
  }
}

async function renderWalletAvatarThumbnail(size: number, avatarBuffer: Buffer | null, initials: string): Promise<Buffer> {
  const ring = Math.max(4, Math.round(size * 0.07));
  const outer = size + ring * 2;
  const inner = avatarBuffer
    ? await applyCircleMask(avatarBuffer, size)
    : await renderInitialsAvatarCircle(size, initials);

  return sharp({
    create: {
      width: outer,
      height: outer,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: inner, top: ring, left: ring }])
    .png()
    .toBuffer();
}

async function renderAvatarThumbnails(user: Pick<WalletPassUser, 'displayName' | 'username' | 'avatarUrl'>): Promise<{ thumb: Buffer; thumb2x: Buffer }> {
  const fallbackName = formatWalletDisplayName(user.displayName ?? '', String(user.username ?? 'U'));
  const initials = walletPassInitials(fallbackName);
  const avatarBuffer = await fetchAvatarBuffer(user.avatarUrl);
  const thumb = await renderWalletAvatarThumbnail(90, avatarBuffer, initials);
  const thumb2x = await renderWalletAvatarThumbnail(180, avatarBuffer, initials);
  return { thumb, thumb2x };
}

async function renderWalletStrip(width: number, height: number, tierLabel: string): Promise<Buffer> {
  const tier = tierLabel.toUpperCase().replace(/[<>&"']/g, '');
  const fontSize = Math.max(12, Math.round(height * 0.28));
  const tierSize = Math.max(10, Math.round(height * 0.24));
  const textY = Math.round(height * 0.68);
  const tierPadX = Math.max(8, Math.round(height * 0.2));
  const tierPadY = Math.max(3, Math.round(height * 0.08));
  const tierTextWidth = Math.max(28, Math.round(tier.length * tierSize * 0.62));
  const badgeW = tierTextWidth + tierPadX * 2;
  const badgeH = tierSize + tierPadY * 2;
  const badgeX = width - 18 - badgeW;
  const badgeY = Math.round((height - badgeH) / 2);
  const badgeRx = Math.max(4, Math.round(height * 0.1));
  
  // Enhanced gradient using CulturePass color palette
  const svg =
    '<svg width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">' +
    '<stop offset="0%" stop-color="' + WALLET_CARD.terracotta + '"/><stop offset="100%" stop-color="' + WALLET_CARD.saffron + '"/>' +
    '</linearGradient></defs>' +
    '<rect width="' + width + '" height="' + height + '" fill="url(#bg)"/>' +
    '<line x1="0" y1="' + (height - 1) + '" x2="' + width + '" y2="' + (height - 1) + '" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>' +
    '<text x="18" y="' + textY + '" font-family="Arial,Helvetica,sans-serif" font-size="' + fontSize + '" font-weight="800" fill="#FFFFFF" letter-spacing="1.5">CULTUREPASS ID</text>' +
    '<rect x="' + badgeX + '" y="' + badgeY + '" width="' + badgeW + '" height="' + badgeH + '" rx="' + badgeRx + '" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>' +
    '<text x="' + (badgeX + badgeW / 2) + '" y="' + (badgeY + badgeH * 0.68) + '" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="' + tierSize + '" font-weight="800" fill="#FFFFFF" letter-spacing="1.1">' + tier + '</text>' +
    '</svg>';

  try {
    return await sharp(Buffer.from(svg)).png().toBuffer();
  } catch {
    return TRANSPARENT_PNG_BUFFER;
  }
}

// Enhanced version with better visual design
async function renderEnhancedWalletStrip(width: number, height: number, tierLabel: string): Promise<Buffer> {
  const tier = tierLabel.toUpperCase().replace(/[<>&"']/g, '');
  const fontSize = Math.max(12, Math.round(height * 0.28));
  const tierSize = Math.max(10, Math.round(height * 0.24));
  const textY = Math.round(height * 0.68);
  const tierPadX = Math.max(8, Math.round(height * 0.2));
  const tierPadY = Math.max(3, Math.round(height * 0.08));
  const tierTextWidth = Math.max(28, Math.round(tier.length * tierSize * 0.62));
  const badgeW = tierTextWidth + tierPadX * 2;
  const badgeH = tierSize + tierPadY * 2;
  const badgeX = width - 18 - badgeW;
  const badgeY = Math.round((height - badgeH) / 2);
  const badgeRx = Math.max(4, Math.round(height * 0.1));
  
  // Enhanced gradient using CulturePass color palette with subtle pattern
  const svg =
    '<svg width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
      '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="' + WALLET_CARD.terracotta + '"/><stop offset="100%" stop-color="' + WALLET_CARD.saffron + '"/>' +
      '</linearGradient>' +
      '<pattern id="pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">' +
      '<circle cx="2" cy="2" r="0.5" fill="rgba(255,255,255,0.05)" />' +
      '</pattern>' +
    '</defs>' +
    '<rect width="' + width + '" height="' + height + '" fill="url(#bg)"/>' +
    '<rect width="' + width + '" height="' + height + '" fill="url(#pattern)"/>' +
    '<line x1="0" y1="' + (height - 1) + '" x2="' + width + '" y2="' + (height - 1) + '" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>' +
    '<text x="18" y="' + textY + '" font-family="Arial,Helvetica,sans-serif" font-size="' + fontSize + '" font-weight="800" fill="#FFFFFF" letter-spacing="1.5">CULTUREPASS ID</text>' +
    '<rect x="' + badgeX + '" y="' + badgeY + '" width="' + badgeW + '" height="' + badgeH + '" rx="' + badgeRx + '" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>' +
    '<text x="' + (badgeX + badgeW / 2) + '" y="' + (badgeY + badgeH * 0.68) + '" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="' + tierSize + '" font-weight="800" fill="#FFFFFF" letter-spacing="1.1">' + tier + '</text>' +
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
  const displayName = formatWalletDisplayName(user.displayName ?? '', username);
  const profileUrl = buildProfileUrl(user);
  const culturePassId = String(user.culturePassId ?? `CP-${user.id}`);
  const tierLabel = formatWalletTierLabel(user.tier || 'free');
  const serialNumber = buildApplePassSerialNumber(user.id);
  const authenticationToken = getApplePassAuthenticationToken(serialNumber);
  const webServiceBaseUrl =
    envOptional('APPLE_PASS_WEBSERVICE_URL') ?? `${getPublicAppOrigin()}/api/wallet/apple/v1`;
  const memberSince = formatWalletMemberSince(user.createdAt);
  const qrPayload = buildWalletQrPayload(user);
  const initials = walletPassInitials(displayName);
  const avatarBuffer = await fetchAvatarBuffer(user.avatarUrl);
  const icon = await renderBrandAsset(58, 58, true);
  const icon2x = await renderBrandAsset(116, 116, true);
  const logo = await renderBrandAsset(50, 50, true);
  const logo2x = await renderBrandAsset(100, 100, true);
  // Using enhanced strip with new branding
  const strip = await renderEnhancedWalletStrip(375, 44, tierLabel);
  const strip2x = await renderEnhancedWalletStrip(750, 88, tierLabel);
  const thumb = await renderWalletAvatarThumbnail(96, avatarBuffer, initials);
  const thumb2x = await renderWalletAvatarThumbnail(192, avatarBuffer, initials);

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier,
    teamIdentifier,
    organizationName: 'CulturePass',
    description: `CulturePass ID · ${WALLET_CARD.passRevision}`,
    logoText: ' ',
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
      'strip.png': strip,
      'strip@2x.png': strip2x,
      'thumbnail.png': thumb,
      'thumbnail@2x.png': thumb2x,
    },
    certificates,
    {
      serialNumber,
      description: `CulturePass ID · ${culturePassId}`,
      organizationName: 'CulturePass',
      backgroundColor: WALLET_CARD.appleBackground,
      foregroundColor: WALLET_CARD.appleForeground,
      labelColor: WALLET_CARD.appleLabel,
    }
  );

  pass.primaryFields.push({
    key: 'member_name',
    label: ' ',
    value: displayName,
  });

  pass.secondaryFields.push({
    key: 'username',
    label: ' ',
    value: `@${username}`,
  });

  pass.auxiliaryFields.push({
    key: 'member_since',
    label: 'MEMBER SINCE',
    value: memberSince,
  });

  pass.auxiliaryFields.push({
    key: 'cpid_front',
    label: 'ID',
    value: culturePassId,
  });

  for (const field of buildWalletBackFields(user, profileUrl, culturePassId, tierLabel, memberSince)) {
    pass.backFields.push({
      key: field.key,
      label: field.label,
      value: field.value,
    });
  }

  pass.setBarcodes({
    message: qrPayload,
    format: 'PKBarcodeFormatQR',
    messageEncoding: 'iso-8859-1',
    altText: culturePassId,
  });

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
      hexBackgroundColor: WALLET_CARD.terracotta, // Using CulturePass terracotta color
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
        hexBackgroundColor: WALLET_CARD.terracotta, // Using CulturePass terracotta color
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

// Enhanced ticket pass with improved branding
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
  // Using CulturePass branding with enhanced colors
  const logo = await renderWalletLogo(160, 50);
  const logo2x = await renderWalletLogo(320, 100);

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
      backgroundColor: 'rgb(227, 106, 78)', // CulturePass terracotta
      foregroundColor: 'rgb(255,255,255)',
      labelColor: 'rgb(212, 160, 23)', // Heritage gold
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
  apple: { ready: boolean; missing: string[]; mockCredentials?: boolean };
  /** Enough to issue event tickets + create ticket Generic class. */
  google: { ready: boolean; missing: string[]; mockCredentials?: boolean };
  /** Includes Generic class id required for the member business card save URL. */
  googleBusinessCard: { ready: boolean; missing: string[]; mockCredentials?: boolean };
  mockCredentials: boolean;
  publicOrigin: string;
} {
  const appleMissing = APPLE_WALLET_REQUIRED.filter((k) => !getEnvVal(k).trim());
  const googleCoreMissing = GOOGLE_WALLET_CORE.filter((k) => !getEnvVal(k).trim());
  const googleBusinessMissing = [
    ...googleCoreMissing,
    ...GOOGLE_WALLET_BUSINESS_CARD_EXTRA.filter((k) => !getEnvVal(k).trim()),
  ];
  const appleMockCredentials = isMockAppleConfiguration();
  const googleMockCredentials = isMockGoogleConfiguration();
  const mockCredentials = appleMockCredentials || googleMockCredentials;
  return {
    apple: { ready: appleMissing.length === 0, missing: appleMissing, mockCredentials: appleMockCredentials },
    google: { ready: googleCoreMissing.length === 0, missing: googleCoreMissing, mockCredentials: googleMockCredentials },
    googleBusinessCard: {
      ready: googleBusinessMissing.length === 0,
      missing: googleBusinessMissing,
      mockCredentials: googleMockCredentials,
    },
    mockCredentials,
    publicOrigin: getPublicAppOrigin(),
  };
}