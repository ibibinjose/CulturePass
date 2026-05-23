import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  canIssueDirectTicket,
  resolveTicketOrderPricing,
  TicketPricingError,
} from '../../functions/src/services/ticketPricing';
import type { FirestoreEvent } from '../../functions/src/services/events';

const repoRoot = process.cwd();

function makeEvent(overrides: Partial<FirestoreEvent> = {}): FirestoreEvent {
  return {
    id: 'event-1',
    title: 'Paid Festival',
    description: 'Test event',
    communityId: 'community-1',
    venue: 'Town Hall',
    date: '2026-05-10',
    time: '19:00',
    city: 'Sydney',
    country: 'Australia',
    status: 'published',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    priceCents: 2500,
    entryType: 'ticketed',
    isFree: false,
    organizerId: 'organizer-1',
    ...overrides,
  };
}

{
  const pricing = resolveTicketOrderPricing(makeEvent(), {
    quantity: 2,
    tierName: 'General',
  });
  assert.equal(pricing.unitPriceCents, 2500);
  assert.equal(pricing.totalPriceCents, 5000);
  assert.equal(canIssueDirectTicket(makeEvent(), pricing), false);
}

{
  const event = makeEvent({
    tiers: [
      { name: 'General', priceCents: 3000, available: 100 },
      { name: 'VIP', priceCents: 9000, available: 10 },
    ],
  });
  const pricing = resolveTicketOrderPricing(event, { quantity: 1, tierName: 'vip' });
  assert.equal(pricing.tierName, 'VIP');
  assert.equal(pricing.totalPriceCents, 9000);
}

assert.throws(
  () => resolveTicketOrderPricing(makeEvent({ tiers: [{ name: 'General', priceCents: 3000, available: 100 }] }), {
    quantity: 1,
    tierName: 'Backstage',
  }),
  TicketPricingError,
);

{
  const event = makeEvent({ isFree: true, entryType: 'free_open', priceCents: 2500 });
  const pricing = resolveTicketOrderPricing(event, { quantity: 3 });
  assert.equal(pricing.totalPriceCents, 0);
  assert.equal(canIssueDirectTicket(event, pricing), true);
}

assert.throws(
  () => resolveTicketOrderPricing(makeEvent({ maxTicketsPerOrder: 2 }), { quantity: 3 }),
  TicketPricingError,
);

{
  const authHandlerSource = readFileSync(join(repoRoot, 'functions/src/handlers/auth.ts'), 'utf8');
  assert.equal(authHandlerSource.includes('make-me-admin'), false);
  assert.equal(authHandlerSource.includes("setCustomUserClaims(uid, { role: 'platformAdmin'"), false);
}

{
  const stripeHandlerSource = readFileSync(join(repoRoot, 'functions/src/handlers/stripe.ts'), 'utf8');
  assert.equal(stripeHandlerSource.includes('totalPriceCents: z.coerce.number().int().nonnegative()'), false);
  assert.equal(stripeHandlerSource.includes('unit_amount:  draft.totalPriceCents'), true);
  assert.equal(stripeHandlerSource.includes('resolveTicketOrderPricing(event'), true);
}

{
  const ticketsHandlerSource = readFileSync(join(repoRoot, 'functions/src/handlers/tickets.ts'), 'utf8');
  assert.equal(ticketsHandlerSource.includes('canIssueDirectTicket(event, pricing)'), true);
  assert.equal(ticketsHandlerSource.includes("throw new Error('PAYMENT_REQUIRED')"), true);
  assert.equal(ticketsHandlerSource.includes('isOwnerOrAdmin(req.user!, event.organizerId'), true);
}

for (const handlerPath of [
  'functions/src/handlers/restaurants.ts',
  'functions/src/handlers/shopping.ts',
  'functions/src/handlers/movies.ts',
  'functions/src/handlers/perks.ts',
]) {
  const source = readFileSync(join(repoRoot, handlerPath), 'utf8');
  assert.equal(source.includes('isOwnerOrAdmin(req.user!'), true, `${handlerPath} must enforce owner/admin updates`);
}

{
  const firestoreRulesSource = readFileSync(join(repoRoot, 'firebase/firestore.rules'), 'utf8');
  assert.equal(firestoreRulesSource.includes('get(/databases/$(database)/documents/users/$(uid()))'), false);
  assert.equal(firestoreRulesSource.includes("allow list:   if signedIn();   // scoped by userId query in app"), false);
  assert.equal(
    firestoreRulesSource.includes("allow list:   if signedIn() && resource.data.userId == uid();"),
    true,
  );
  assert.equal(firestoreRulesSource.includes("isSafeUserSelfUpdate()"), true);
  assert.equal(firestoreRulesSource.includes("unchanged('organizerId')"), true);
  assert.equal(firestoreRulesSource.includes("unchanged('ownerId')"), true);
  assert.equal(firestoreRulesSource.includes("unchanged('sellerUserId')"), true);
  assert.equal(firestoreRulesSource.includes('optionalHttpUrl'), true);
  assert.equal(firestoreRulesSource.includes('match /privacySettings/{userId}'), true);
  assert.equal(firestoreRulesSource.includes('match /paymentMethods/{methodId}'), true);
  assert.equal(firestoreRulesSource.includes('match /communityPosts/{postId}'), true);
}

{
  const storageRulesSource = readFileSync(join(repoRoot, 'firebase/storage.rules'), 'utf8');
  assert.equal(storageRulesSource.includes("'image/svg+xml'"), false);
  assert.equal(storageRulesSource.includes('isBlockedImageName'), true);
  assert.equal(storageRulesSource.includes('request.resource.contentType in ['), true);
}

{
  const authMiddlewareSource = readFileSync(join(repoRoot, 'functions/src/middleware/auth.ts'), 'utf8');
  assert.equal(authMiddlewareSource.includes("1VLiq1SEUzWNM7J2XScWn3UbFI52"), false);
  assert.equal(authMiddlewareSource.includes("process.env[name]"), true);
  assert.equal(authMiddlewareSource.includes("SUPER_ADMIN_UIDS"), true);
}

{
  const rateLimitSource = readFileSync(join(repoRoot, 'functions/src/middleware/rateLimit.ts'), 'utf8');
  assert.equal(rateLimitSource.includes("headers['x-forwarded-for']"), false);
  assert.equal(rateLimitSource.includes('extractClientIp'), true);
  assert.equal(rateLimitSource.includes('Failing closed'), true);
}

{
  const appSource = readFileSync(join(repoRoot, 'functions/src/app.ts'), 'utf8');
  assert.equal(appSource.includes('LOCALHOST_ORIGIN_ONLY'), false);
  assert.equal(appSource.includes("app.set('trust proxy', 1)"), true);
  assert.equal(appSource.includes('contentSecurityPolicy: false'), false);
  assert.equal(appSource.includes("passOnStoreError: false"), true);
}

{
  const utilsSource = readFileSync(join(repoRoot, 'functions/src/handlers/utils.ts'), 'utf8');
  assert.equal(utilsSource.includes("throw new Error(parsed.error.issues"), false);
  assert.equal(utilsSource.includes('throw new RequestValidationError(parsed.error)'), true);
  assert.equal(utilsSource.includes('class RequestValidationError'), true);
  assert.equal(utilsSource.includes('normalizeSafeExternalUrl'), true);
}

{
  const frontendUrlSource = readFileSync(join(repoRoot, 'src/lib/openExternalUrl.ts'), 'utf8');
  assert.equal(frontendUrlSource.includes('isSafeExternalUrl'), true);
  assert.equal(frontendUrlSource.includes('javascript:'), false);
}

{
  const uploadsHandlerSource = readFileSync(join(repoRoot, 'functions/src/handlers/uploads.ts'), 'utf8');
  assert.equal(uploadsHandlerSource.includes('MAX_IMAGE_PIXELS'), true);
  assert.equal(uploadsHandlerSource.includes('limitInputPixels: MAX_IMAGE_PIXELS'), true);
  assert.equal(uploadsHandlerSource.includes('width * height > MAX_IMAGE_PIXELS'), true);
}

{
  const processImageSource = readFileSync(join(repoRoot, 'server/src/routes/processImage.ts'), 'utf8');
  assert.equal(processImageSource.includes('maxPixels'), true);
  assert.equal(processImageSource.includes('width * height > maxPixels'), true);
}

console.log('security regression checks passed');
