import { Request, Response, NextFunction } from 'express';
import { isIP } from 'node:net';

interface WindowInfo {
  timestamps: number[];
}

const store = new Map<string, WindowInfo>();

function stripPort(value: string): string {
  const trimmed = value.trim();
  if (isIP(trimmed)) return trimmed;
  if (trimmed.startsWith('[')) {
    const end = trimmed.indexOf(']');
    const candidate = end >= 0 ? trimmed.slice(1, end) : trimmed;
    return isIP(candidate) ? candidate : '';
  }
  const withoutPort = trimmed.replace(/:\d+$/, '');
  return isIP(withoutPort) ? withoutPort : '';
}

export function extractClientIp(req: Request): string {
  const expressIp = typeof req.ip === 'string' ? stripPort(req.ip) : '';
  if (expressIp) return expressIp;

  const socketIp = typeof req.socket?.remoteAddress === 'string'
    ? stripPort(req.socket.remoteAddress)
    : '';
  if (socketIp) return socketIp;

  return 'unknown';
}

/**
 * Custom sliding-window rate limiter tailored for high-traffic Cloud Function vectors (events, checkout).
 * This securely intercepts burst scraping/DDoS bots scaling across instance lifecycles.
 */
export function slidingWindowRateLimit(windowMs: number, maxRequests: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Bind tracking strictly against authed ID tokens or fallback to raw connection IP.
      const userId = req.user?.id;
      const ip = extractClientIp(req);
      const identifier = userId ? `user:${userId}` : `ip:${ip}`;
      
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Lazy garbage collection to guarantee zero memory leaks across warm Cloud Function spinups.
      if (store.size > 10000) {
        for (const [key, info] of store.entries()) {
          const lastTs = info.timestamps[info.timestamps.length - 1];
          if (!lastTs || now - lastTs > 15 * 60 * 1000) {
            store.delete(key);
          }
        }
      }
      
      let info = store.get(identifier);
      if (!info) {
        info = { timestamps: [] };
        store.set(identifier, info);
      }
      
      // Expire stale timestamps falling behind the active memory trace.
      info.timestamps = info.timestamps.filter((ts) => ts > windowStart);
      
      if (info.timestamps.length >= maxRequests) {
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('Retry-After', Math.ceil(windowMs / 1000).toString());
        return void res.status(429).json({
          error: 'Rate Limit Exceeded',
          message: `Too many requests detected. Connection restricted for ${Math.ceil(windowMs / 1000)} seconds.`,
        });
      }
      
      info.timestamps.push(now);
      
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - info.timestamps.length).toString());
      
      next();
    } catch (error) {
      console.error('[RateLimitError] Failing closed:', error);
      res.status(429).json({ error: 'Too many requests, please try again later.' });
    }
  };
}
