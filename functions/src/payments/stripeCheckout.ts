import * as functions from 'firebase-functions/v1';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { stripeClient } from '../admin';

const db = admin.firestore();

type CheckoutArgs = { uid: string; email: string | undefined; perkId: string };

async function createPerkCheckoutSession(args: CheckoutArgs): Promise<{ sessionId: string; url: string | null }> {
  const { uid, email, perkId } = args;

  if (!stripeClient) {
    throw new Error('STRIPE_NOT_CONFIGURED');
  }

  const perkDoc = await db.collection('perks').doc(perkId).get();
  if (!perkDoc.exists) {
    throw new Error('NOT_FOUND');
  }

  const perk = perkDoc.data();
  if (!perk || perk.priceTier === 'free') {
    throw new Error('FREE_PERK');
  }

  const priceCents = perk.discountedPriceCents || perk.originalPriceCents || 500;

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ['card', 'link'],
    mode: 'payment',
    success_url: `https://culturepass.app/p/${perkId}?success=true`,
    cancel_url: `https://culturepass.app/p/${perkId}?canceled=true`,
    customer_email: email,
    client_reference_id: uid,
    metadata: {
      perkId,
      userId: uid,
    },
    line_items: [
      {
        price_data: {
          currency: 'aud',
          product_data: {
            name: perk.title || 'Premium Cultural Perk',
            description: perk.description || 'Exclusive access via CulturePass.',
            images: perk.coverUrl ? [perk.coverUrl] : [],
          },
          unit_amount: priceCents,
        },
        quantity: 1,
      },
    ],
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * 1st gen — keep until `createCheckoutSessionV2` is verified, then remove this export
 * and rename V2 → `createCheckoutSession` (see Firebase 2nd gen upgrade guide).
 */
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to purchase perks.');
  }
  const uid = context.auth.uid;
  const { perkId } = data as { perkId?: string };
  if (!perkId) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a perkId.');
  }

  try {
    return await createPerkCheckoutSession({
      uid,
      email: context.auth.token.email,
      perkId,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND') {
        throw new functions.https.HttpsError('not-found', 'Perk not found.');
      }
      if (error.message === 'FREE_PERK') {
        throw new functions.https.HttpsError('failed-precondition', 'This perk is free and does not require checkout.');
      }
      if (error.message === 'STRIPE_NOT_CONFIGURED') {
        throw new functions.https.HttpsError('failed-precondition', 'Payments are not configured.');
      }
    }
    console.error('Error creating Stripe Checkout session:', error);
    throw new functions.https.HttpsError('internal', 'Unable to create checkout session.');
  }
});

/** 2nd gen (Cloud Run). New name required until 1st gen `createCheckoutSession` is deleted. */
export const createCheckoutSessionV2 = onCall(
  {
    region: 'australia-southeast1',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be logged in to purchase perks.');
    }
    const uid = request.auth.uid;
    const { perkId } = request.data as { perkId?: string };
    if (!perkId) {
      throw new HttpsError('invalid-argument', 'The function must be called with a perkId.');
    }

    try {
      return await createPerkCheckoutSession({
        uid,
        email: request.auth.token.email,
        perkId,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'NOT_FOUND') {
          throw new HttpsError('not-found', 'Perk not found.');
        }
        if (error.message === 'FREE_PERK') {
          throw new HttpsError('failed-precondition', 'This perk is free and does not require checkout.');
        }
        if (error.message === 'STRIPE_NOT_CONFIGURED') {
          throw new HttpsError('failed-precondition', 'Payments are not configured.');
        }
      }
      console.error('Error creating Stripe Checkout session:', error);
      throw new HttpsError('internal', 'Unable to create checkout session.');
    }
  },
);
