import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from 'firebase-functions';
import { authenticate } from './middleware/auth';
import { getFirebaseProjectId } from './handlers/utils';
import { extractClientIp } from './middleware/rateLimit';

// HTTP handlers (Express routers)
import { authRouter } from './handlers/auth';
import { ticketsRouter } from './handlers/tickets';
import { createEventsRouter } from './handlers/events';
import { createStripeRouter } from './handlers/stripe';
import { createIndigenousRouter } from './handlers/indigenous';
import { usersRouter } from './handlers/users';
import { locationsRouter } from './handlers/locations';
import { profilesRouter } from './handlers/profiles';
import { activitiesRouter } from './handlers/activities';
import { moviesRouter } from './handlers/movies';
import { shoppingRouter } from './handlers/shopping';
import { restaurantsRouter } from './handlers/restaurants';
import { councilRouter } from './handlers/council';
import { miscRouter } from './handlers/misc';
import { searchRouter } from './handlers/search';
import { socialRouter } from './handlers/social';
import { discoveryRouter } from './handlers/discovery';
import { perksRouter } from './handlers/perks';
import { feedRouter } from './handlers/feed';
import { membershipRouter } from './handlers/membership';
import { citiesRouter } from './handlers/cities';
import { rewardsRouter } from './handlers/rewards';
import { cultureExplorerRouter } from './handlers/cultureExplorer';
import { calendarRouter } from './handlers/calendar';
import { cultureTodayRouter } from './handlers/cultureToday';
import { offeringsRouter } from './handlers/offerings';
import { uploadsRouter } from './handlers/uploads';
import { walletRouter } from './handlers/wallet';
import { adminRouter } from './handlers/admin';
import { hostApplicationRouter } from './handlers/hostApplication';
import { cultureShopRouter } from './handlers/cultureShop';
import { waitlistRouter } from './handlers/waitlist';
import { reviewsRouter } from './handlers/reviews';

export const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Explicit allowlist — credentials mode requires an origin function (not `true`)
const LOCAL_DEV_PORTS = [8081, 8082, 8083, 8084, 8085, 19006, 19000, 3000, 5000, 5173, 4173];
const LOCAL_DEV_HOSTS = ['localhost', '127.0.0.1'] as const;
const LOCAL_DEV_ORIGINS = LOCAL_DEV_HOSTS.flatMap((host) =>
  LOCAL_DEV_PORTS.flatMap((port) => [`http://${host}:${port}`, `https://${host}:${port}`]),
);

const CORS_EXTRA = (process.env.CORS_EXTRA_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const firebaseProjectId = getFirebaseProjectId();
const firebaseHostingOrigins: RegExp[] = firebaseProjectId
  ? [
      new RegExp(`^https://${escapeRegExp(firebaseProjectId)}\\.web\\.app$`),
      new RegExp(`^https://${escapeRegExp(firebaseProjectId)}\\.firebaseapp\\.com$`),
      new RegExp(`^https://[\\w-]+--${escapeRegExp(firebaseProjectId)}\\.web\\.app$`), // Firebase preview channels
    ]
  : [
      /^https:\/\/[\w-]+\.web\.app$/,
      /^https:\/\/[\w-]+\.firebaseapp\.com$/,
    ];

const ALLOWED_ORIGINS: (string | RegExp)[] = [
  // Production
  'https://culturepass.app',
  'https://www.culturepass.app',
  /^https:\/\/[\w-]+\.culturepass\.app$/,          // preview/staging subdomains
  'https://culturekerala.com',
  'https://www.culturekerala.com',
  /^https:\/\/[\w-]+\.culturekerala\.com$/,
  // EAS/Expo OTA
  /^https:\/\/[\w-]+\.expo\.dev$/,
  // Hosted previews (set CORS_EXTRA_ORIGINS for private URLs)
  /^https:\/\/[\w-]+\.vercel\.app$/,
  /^https:\/\/[\w-]+\.netlify\.app$/,
  /^https:\/\/[\w-]+\.ngrok(-free)?\.app$/,
  ...firebaseHostingOrigins,
  // Local development (http + https — Expo / Vite may use TLS locally)
  ...LOCAL_DEV_ORIGINS,
  // IPv6 loopback on explicitly allowed development ports only.
  /^https?:\/\/\[::1\]:\d+$/,
  // Local network development (Expo on LAN; optional https tunnels)
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/,
  /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}:\d+$/,
  // *.local mDNS hostnames (common with Expo dev clients)
  /^https?:\/\/[\w-]+\.local:\d+$/,
  ...CORS_EXTRA,
];

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // non-browser clients (Postman, React Native native)
  return ALLOWED_ORIGINS.some(allowed =>
    typeof allowed === 'string' ? allowed === origin : allowed.test(origin),
  );
}

const corsOptions: cors.CorsOptions = {
  // With credentials: true, browsers require Access-Control-Allow-Origin to echo the
  // request Origin (not `*`). Reflect the string explicitly.
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, false);
      return;
    }
    if (isAllowedOrigin(origin)) {
      callback(null, origin);
      return;
    }
    const err = new Error(`CORS: Origin '${origin}' not allowed`) as Error & { status?: number };
    err.status = 403;
    callback(err);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Accept-Language',
    'If-None-Match',
  ],
  maxAge: 86400, // preflight cache 24 h
};

// --- Middleware ---
app.disable('x-powered-by');
app.set('trust proxy', 1);

/**
 * Preflight must succeed with CORS headers before helmet/json/rate-limit.
 * If `allowedHeaders` in cors() omits a header the browser lists in
 * Access-Control-Request-Headers, the preflight fails and Chrome reports
 * "No 'Access-Control-Allow-Origin'" (misleading). For allowlisted origins,
 * echo the requested header list so Expo / devtools / future clients never break.
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'OPTIONS') {
    next();
    return;
  }
  const origin = req.headers.origin;
  if (typeof origin !== 'string' || !isAllowedOrigin(origin)) {
    next();
    return;
  }
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  const requestedHeaders = req.headers['access-control-request-headers'];
  if (typeof requestedHeaders === 'string' && requestedHeaders.length > 0) {
    res.setHeader('Access-Control-Allow-Headers', requestedHeaders);
  } else {
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Accept-Language, If-None-Match',
    );
  }
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
  res.status(204).end();
});

// CORS before helmet/json so every response (including errors) gets ACAO when origin matches
app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Firebase Hosting rewrites
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      mediaSrc: ["'self'", 'data:', 'blob:', 'https:'],
      fontSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      connectSrc: ["'self'", 'https:', 'wss:'],
      upgradeInsecureRequests: null,
    },
  },
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(
  express.json({
    limit: '2mb',
    verify: (req: Request, _res, buf: Buffer) => {
      req.rawBody = buf;
    },
  }),
);
// Do not count CORS preflight toward the limit — a burst of OPTIONS can otherwise
// return 429 without CORS headers and the browser reports a misleading CORS failure.
app.use(
  rateLimit({
    windowMs: 60000,
    max: 200,
    message: 'Too many requests, please try again later.',
    skip: (req) => req.method === 'OPTIONS',
    keyGenerator: (req) => req.user?.id ? `user:${req.user.id}` : `ip:${extractClientIp(req)}`,
    passOnStoreError: false,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
);
app.use(authenticate);

// ─── Request logging ──────────────────────────────────────────────────────────
// Structured one-liner per request — visible in Firebase Cloud Logging.
app.use((req, _res, next) => {
  const uid = (req as Request & { user?: { id?: string } }).user?.id ?? '-';
  logger.info('http_request', {
    method: req.method,
    path: req.path,
    uid,
    ip: extractClientIp(req),
    ua: req.headers['user-agent']?.slice(0, 80) ?? '-',
  });
  next();
});

// --- Health Check ---
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── API Version header ───────────────────────────────────────────────────────
app.use((_req, res, next) => { res.setHeader('X-Api-Version', '1'); next(); });

// --- Routes ---
// Routes are mounted at:
//   /             — direct Cloud Function invocation (legacy)
//   /api/         — Firebase Hosting rewrite (current standard)
//   /v1/          — versioned alias (forward-compatible)
//   /api/v1/      — versioned alias via Hosting rewrite
//
// New clients should target /api/v1/*. Old clients at /api/* keep working.
// When a breaking change is needed, mount the new router at /v2/ only.
const mount = (path: string, router: any) => {
  app.use(path, router);
  app.use(`/api${path}`, router);
  app.use(`/v1${path}`, router);
  app.use(`/api/v1${path}`, router);
};

mount('/', authRouter);
mount('/', ticketsRouter);
mount('/', usersRouter);
mount('/', locationsRouter);
mount('/', profilesRouter);
mount('/', activitiesRouter);
mount('/', moviesRouter);
mount('/', shoppingRouter);
mount('/', restaurantsRouter);
mount('/', councilRouter);
mount('/', miscRouter);
mount('/', searchRouter);
mount('/', socialRouter);
mount('/', discoveryRouter);
mount('/', perksRouter);
mount('/', feedRouter);
mount('/', membershipRouter);
mount('/', rewardsRouter);
mount('/', cultureExplorerRouter);
mount('/', citiesRouter);
mount('/', calendarRouter);
mount('/', cultureTodayRouter);
mount('/', offeringsRouter);
mount('/', uploadsRouter);
mount('/', walletRouter);
mount('/', adminRouter);
mount('/', cultureShopRouter);
mount('/', hostApplicationRouter);
mount('/', waitlistRouter);
mount('/', reviewsRouter);
mount('/', profilesRouter);

// Special handling for factory routers
const eventsRouter = createEventsRouter();
app.use('/', eventsRouter);
app.use('/api', eventsRouter);
app.use('/v1', eventsRouter);
app.use('/api/v1', eventsRouter);

const indigenousRouter = createIndigenousRouter();
app.use('/', indigenousRouter);
app.use('/api', indigenousRouter);
app.use('/v1', indigenousRouter);
app.use('/api/v1', indigenousRouter);

app.use(createStripeRouter());

// OPTIONS that did not match an earlier handler (should be rare) — respond 204 + CORS
app.use((req, res, next) => {
  if (req.method !== 'OPTIONS') {
    next();
    return;
  }
  const origin = req.headers.origin;
  if (typeof origin === 'string' && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    const requestedHeaders = req.headers['access-control-request-headers'];
    if (typeof requestedHeaders === 'string' && requestedHeaders.length > 0) {
      res.setHeader('Access-Control-Allow-Headers', requestedHeaders);
    } else {
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, Accept, Accept-Language, If-None-Match',
      );
    }
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Vary', 'Origin');
    res.status(204).end();
    return;
  }
  next();
});

// Default 404 — include CORS when Origin is allowlisted so the browser does not
// report a misleading "No Access-Control-Allow-Origin" (e.g. stray OPTIONS).
app.use((req, res) => {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.status(404).json({ error: 'Not Found' });
});

// Error handler — never exposes internal details in production
app.use((err: Error & { status?: number }, req: Request, res: Response, _next: NextFunction) => {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  const status = err.status ?? 500;
  logger.error('[App Error]', err);
  const safe = status < 500;  // 4xx errors are safe to surface to clients
  res.status(status).json({
    error: safe ? err.message : 'Internal Server Error',
  });
});
