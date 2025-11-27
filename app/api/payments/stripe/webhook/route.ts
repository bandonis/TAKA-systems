import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import type { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { getPrisma } from '@/lib/db';
import { ensureB2CReceipt, getStripeClient } from '@/lib/payments';
import { PAYMENT_STATUS, PAYMENT_TYPE } from '@/lib/prisma/enums';

export const runtime = "nodejs";

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return secret;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const prisma = getPrisma();
  const metadata = session.metadata || {};
  const tenantId = metadata.tenantId;
  const participantId = metadata.participantId;

  if (!tenantId || !participantId) {
    return;
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const participant = await tx.eventParticipant.findFirst({
      where: { id: participantId, tenantId }
    });

    if (!participant) {
      return;
    }

    if (participant.paymentStatus === PAYMENT_STATUS.PAID) {
      return;
    }

    const amountTotal = session.amount_total;
    if (!amountTotal) {
      throw new Error('Checkout session missing amount_total');
    }

    const currency = session.currency?.toUpperCase() ?? 'EUR';
    const paymentReference = (session.payment_intent ?? session.id).toString();

    const amountDecimal = new Decimal(amountTotal).dividedBy(100);

    await tx.eventParticipant.update({
      where: { id: participant.id },
      data: {
        paymentStatus: PAYMENT_STATUS.PAID,
        paymentType: PAYMENT_TYPE.ONLINE,
        stripeSessionId: session.id,
        paymentReference,
        amountPaid: amountDecimal
      }
    });

    await ensureB2CReceipt(
      {
        tenantId,
        participantId: participant.id,
        amount: amountDecimal,
        currency,
        paymentReference,
        metadata: {
          stripeSessionId: session.id
        }
      },
      tx
    );
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripe = getStripeClient();
  const webhookSecret = getWebhookSecret();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Invalid Stripe signature', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
    }
  } catch (error) {
    console.error('Error processing Stripe webhook', error);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

