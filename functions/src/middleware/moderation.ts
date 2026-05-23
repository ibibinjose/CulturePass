/**
 * Content moderation middleware for CulturePass Cloud Functions.
 *
 * Performs server-side content analysis on user-submitted text fields to detect:
 *   - Profanity / hate speech
 *   - Suspicious / scam links
 *   - XSS injection attempts
 *   - SQL injection attempts
 *   - Crypto / financial scam patterns
 *   - Phishing patterns
 *   - Excessive repetition (spam)
 *
 * Design notes:
 * - Deep-scans all string values in the request body recursively (not just top-level).
 * - Returns generic 400 messages — NEVER exposes which pattern matched (prevents bypass).
 * - False positive rate is intentionally conservative; edge cases surface to human review.
 * - This is a first-pass filter; human moderators handle nuanced cases.
 * - Sanitized input is not mutated here — always raw content is persisted and flagged for review.
 */

import { type NextFunction, type Request, type Response } from 'express';

// ---------------------------------------------------------------------------
// Bad words / hate speech
// (Intentionally minimal — enough to block obvious violations;
//  edge cases go to human review queue.)
// ---------------------------------------------------------------------------

const BAD_WORDS = new Set([
  // Hate / abuse
  'nigger', 'nigga', 'faggot', 'fag', 'dyke', 'kike', 'spic', 'chink',
  'wetback', 'tranny', 'retard', 'retarded', 'cracker', 'coon',
  // Violence incitement
  'kys', 'kill yourself', 'go kill', 'bomb threat',
  // Profanity (severe)
  'cunt', 'motherfucker', 'motherfucking',
]);

// ---------------------------------------------------------------------------
// Suspicious / scam URL patterns
// ---------------------------------------------------------------------------

const SUSPICIOUS_URL_PATTERNS: RegExp[] = [
  // URL shorteners commonly used in phishing
  /bit\.ly\//i,
  /tinyurl\.com\//i,
  /t\.co\//i,
  /ow\.ly\//i,
  /rebrand\.ly\//i,
  /buff\.ly\//i,
  /cutt\.ly\//i,
  /is\.gd\//i,
  /v\.gd\//i,
  /rb\.gy\//i,

  // Messaging platform invite links (common spam vector)
  /t\.me\//i,
  /telegram\.me\//i,
  /whatsapp\.com\/chat/i,
  /wa\.me\//i,
  /discord\.gg\//i,

  // Typosquatting of major platforms (phishing)
  /paypa1\.com/i,
  /appleid-support\./i,
  /google-support\./i,
  /microsoft-verify\./i,
  /account-verify\./i,
  /secure-login\./i,
  /signin-verify\./i,
];

// ---------------------------------------------------------------------------
// Crypto / financial scam patterns
// ---------------------------------------------------------------------------

const CRYPTO_SCAM_PATTERNS: RegExp[] = [
  /free\s*(crypto|bitcoin|eth|btc|usdt|nft)/i,
  /double\s*your\s*(bitcoin|btc|eth|money|investment)/i,
  /guaranteed\s*(profit|return|income)/i,
  /earn\s*\d+[%xX]\s*(daily|weekly|monthly|per\s*day)/i,
  /passive\s*income\s*(opportunity|program)/i,
  /investment\s*opportunity.*risk.{0,10}free/i,
  /send\s+\d+\s*(btc|eth|sol|usdt)/i,
  /wallet\s*(drain|drainer)/i,
  /mint\s*your\s*(nft|token)/i,
  /airdrop.*claim/i,
  /get\s*rich\s*quick/i,
  /pump\s*(and|&)\s*dump/i,
];

// ---------------------------------------------------------------------------
// General financial scam / phishing patterns
// ---------------------------------------------------------------------------

const PHISHING_PATTERNS: RegExp[] = [
  /your\s+account\s+(has\s+been\s+)?(suspended|locked|disabled|compromised)/i,
  /verify\s+your\s+(account|identity|payment|bank)/i,
  /update\s+your\s+billing\s+info/i,
  /urgent.*account.*action\s+required/i,
  /click\s+here\s+to\s+(claim|verify|confirm|unlock)/i,
  /congratulations.*winner/i,
  /you\s+have\s+(been\s+selected|won|qualified)/i,
  /limited\s+time\s+offer.*act\s+now/i,
];

// ---------------------------------------------------------------------------
// XSS injection patterns
// ---------------------------------------------------------------------------

const XSS_PATTERNS: RegExp[] = [
  /<script[\s>]/i,
  /<\/script>/i,
  /javascript\s*:/i,
  /on(load|click|error|mouseover|submit|focus|blur|change|input|keyup|keydown)\s*=/i,
  /data\s*:\s*text\s*\/\s*html/i,
  /data\s*:\s*image\s*\/\s*svg\+xml/i,
  /<iframe[\s>]/i,
  /<object[\s>]/i,
  /<embed[\s>]/i,
  /<form[\s>]/i,
  /expression\s*\(/i,          // CSS expression() injection
  /url\s*\(\s*javascript\s*:/i, // CSS url(javascript:...) injection
  /vbscript\s*:/i,
  /&#x?[0-9a-f]+;/i,          // HTML entity encoding bypass attempt
  /%3cscript/i,                // URL-encoded <script
  /%3c%2fscript/i,             // URL-encoded </script
];

// ---------------------------------------------------------------------------
// SQL injection patterns
// ---------------------------------------------------------------------------

const SQL_INJECTION_PATTERNS: RegExp[] = [
  /'\s*(or|and)\s+'?\d/i,              // ' OR 1=1
  /'\s*(or|and)\s+'[^']*'/i,          // ' OR 'a'='a
  /union\s+(all\s+)?select/i,
  /drop\s+(table|database|schema)/i,
  /insert\s+into\s+\w+\s*\(/i,
  /update\s+\w+\s+set\s+\w+\s*=/i,
  /delete\s+from\s+\w+/i,
  /exec\s*(\(|xp_)/i,
  /;\s*(drop|delete|update|insert|exec|create|alter)\s/i,
  /--\s*$|\s*#\s*$/m,                  // SQL comment terminators
  /\/\*[\s\S]*?\*\//,                  // Block comment injection
  /\bsleep\s*\(\d+\)/i,               // Time-based blind SQLi
  /\bwaitfor\s+delay\b/i,             // MSSQL time-based
  /\bload_file\s*\(/i,                // MySQL file read
  /\binto\s+(out|dump)file\b/i,       // MySQL file write
];

// ---------------------------------------------------------------------------
// Spam / repetition patterns
// ---------------------------------------------------------------------------

const SPAM_PATTERNS: RegExp[] = [
  /(.)\1{15,}/,               // Same char repeated 15+ times (aaaaaaa...)
  /(\w{3,})\s+\1(\s+\1){4,}/, // Same word repeated 5+ times
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively extracts all string values from a plain object or array.
 * Limits depth to 8 to prevent DoS via deeply nested payloads.
 */
function extractStrings(value: unknown, depth = 0): string[] {
  if (depth > 8) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap((v) => extractStrings(v, depth + 1));
  if (value !== null && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((v) =>
      extractStrings(v, depth + 1),
    );
  }
  return [];
}

/** True if the string contains a bad word (whole-word and substring check). */
export function textHasProfanity(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const v = value.toLowerCase();
  for (const word of BAD_WORDS) {
    if (v.includes(word)) return true;
  }
  return false;
}

/** True if the string contains a suspicious or scam URL. */
function textHasSuspiciousUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return SUSPICIOUS_URL_PATTERNS.some((p) => p.test(value));
}

/** True if the string matches a crypto/financial scam pattern. */
function textHasCryptoScam(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return CRYPTO_SCAM_PATTERNS.some((p) => p.test(value));
}

/** True if the string matches a phishing pattern. */
function textHasPhishing(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return PHISHING_PATTERNS.some((p) => p.test(value));
}

/** True if the string contains XSS attack patterns. */
export function textHasXss(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return XSS_PATTERNS.some((p) => p.test(value));
}

/** True if the string contains SQL injection patterns. */
export function textHasSqlInjection(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some((p) => p.test(value));
}

/** True if the string looks like automated spam. */
function textIsSpam(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return SPAM_PATTERNS.some((p) => p.test(value));
}

// ---------------------------------------------------------------------------
// Public sanitizer — strips obvious HTML tags for display contexts
// Does NOT replace the moderation checks; use in addition.
// ---------------------------------------------------------------------------

/**
 * Strips HTML tags from a string for safe display.
 * Not a security control — use as a display helper only.
 */
export function sanitizeDisplayText(text: string): string {
  return text
    .replace(/<[^>]+>/g, '') // Strip HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

// ---------------------------------------------------------------------------
// moderationCheck  (Express middleware)
// ---------------------------------------------------------------------------

type CheckFn = (v: unknown) => boolean;

interface ModerationRule {
  check: CheckFn;
  category: string;
}

const RULES: ModerationRule[] = [
  { check: textHasProfanity,     category: 'profanity'          },
  { check: textHasSuspiciousUrl, category: 'suspicious-link'    },
  { check: textHasCryptoScam,    category: 'scam'               },
  { check: textHasPhishing,      category: 'phishing'           },
  { check: textHasXss,           category: 'injection'          },
  { check: textHasSqlInjection,  category: 'injection'          },
  { check: textIsSpam,           category: 'spam'               },
];

/**
 * Express middleware that runs all moderation checks over the request body.
 *
 * - Deep-scans nested objects/arrays up to 8 levels.
 * - Stops on the first matched rule and returns 400.
 * - The response body intentionally uses a generic message — the `category`
 *   field is included so clients can show user-friendly guidance without
 *   revealing the exact pattern that matched.
 * - To skip moderation on a route, simply don't apply this middleware.
 */
export function moderationCheck(req: Request, res: Response, next: NextFunction): void {
  const payload = req.body ?? {};
  const strings = extractStrings(payload);

  for (const rule of RULES) {
    if (strings.some(rule.check)) {
      res.status(400).json({
        error: 'Content could not be submitted. Please review your text and try again.',
        category: rule.category,
      });
      return;
    }
  }

  next();
}

/**
 * Lightweight variant that only checks for injection attacks (XSS + SQL).
 * Use on routes where profanity/scam checks would cause false positives
 * (e.g. admin routes that may contain technical content).
 */
export function injectionCheck(req: Request, res: Response, next: NextFunction): void {
  const payload = req.body ?? {};
  const strings = extractStrings(payload);

  if (strings.some(textHasXss) || strings.some(textHasSqlInjection)) {
    res.status(400).json({
      error: 'Content could not be submitted. Please review your text and try again.',
      category: 'injection',
    });
    return;
  }

  next();
}
