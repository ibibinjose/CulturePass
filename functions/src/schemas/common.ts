/**
 * Shared Zod building blocks for API request schemas.
 * Keeps handlers aligned (events, profiles, commerce) without duplicating helpers.
 */

import { z } from 'zod';

/**
 * JSON clients often send null / "" — normalise to undefined.
 * Prefer union+transform over z.preprocess so `z.output<typeof schema>` stays typed (preprocess yields `unknown`).
 */
export function optionalStringField(maxLength?: number) {
  const inner = maxLength != null ? z.string().max(maxLength) : z.string();
  return z
    .union([inner, z.literal(''), z.null()])
    .optional()
    .transform((v): string | undefined =>
      v === undefined || v === null || v === '' ? undefined : v,
    );
}

/** Empty string/null/undefined omitted; otherwise coerced int with bounds. */
export function optionalIntField(min: number, max?: number) {
  const inner =
    max != null
      ? z.coerce.number().int().min(min).max(max)
      : z.coerce.number().int().min(min);
  return z
    .union([inner, z.literal(''), z.null()])
    .optional()
    .transform((v): number | undefined =>
      v === undefined || v === null || v === '' ? undefined : v,
    );
}

/** Accepts null / ""; normalises invalid empty to undefined. */
export const optionalUrlField = z
  .union([z.string().url(), z.null(), z.literal('')])
  .optional()
  .transform((v): string | undefined => (v == null || v === '' ? undefined : v));

export const optionalEmailField = z
  .union([z.string().email(), z.null(), z.literal('')])
  .optional()
  .transform((v): string | undefined => (v == null || v === '' ? undefined : v));

export const optionalPostcodeField = z
  .union([z.coerce.number().int().min(200).max(9999), z.literal(''), z.null()])
  .optional()
  .transform((v): number | undefined =>
    v === undefined || v === null || v === '' ? undefined : v,
  );

/** Empty string must be listed before `z.coerce.number()` — `Number('')` is 0, not a parse error. */
export const optionalLatLngField = z
  .union([z.literal(''), z.null(), z.coerce.number()])
  .optional()
  .transform((v): number | undefined =>
    v === undefined || v === null || v === '' ? undefined : v,
  );
