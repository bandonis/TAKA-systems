import type { Decimal } from '@prisma/client/runtime/library';

import { calculateEventPrice } from '@/lib/events';

import { getPublicUrl, getStripeClient } from './stripe';

type ParticipantWithEvent = {
  id: string;
  tenantId: string;
  eventId: string;
  email: string;
  ticketCount: number | null;
  amountPaid: Decimal | null;
  event: {
    title: string;
    earlyBirdDeadline: Date | null;
    earlyBirdPrice: Decimal | null;
    priceGroup: Decimal | null;
    priceSingle: Decimal | null;
  };
};

type CheckoutOptions = {
  tenantId: string;
  participant: ParticipantWithEvent;
  currency: string;
  successPath?: string | null;
  cancelPath?: string | null;
};

export async function createCheckoutSessionForParticipant({
  tenantId,
  participant,
  currency,
  successPath,
  cancelPath
}: CheckoutOptions) {
  if (!participant.event) {
    throw new Error('Participant event is required to start checkout');
  }

  if (participant.ticketCount == null || participant.ticketCount <= 0) {
    throw new Error('Invalid ticket count for checkout');
  }

  const ticketCount = participant.ticketCount;

  let amount = participant.amountPaid;
  if (!amount) {
    const pricing = calculateEventPrice(participant.event, ticketCount);
    amount = pricing.total;
  }

  const amountNumber = Number(amount);
  if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
    throw new Error('Invalid registration amount');
  }

  const stripe = getStripeClient();
  const publicUrl = getPublicUrl();
  const baseSuccessUrl = successPath ? `${publicUrl}${successPath}` : `${publicUrl}/payments/success`;
  const successUrl = `${baseSuccessUrl}${baseSuccessUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = cancelPath ? `${publicUrl}${cancelPath}` : `${publicUrl}/payments/cancel`;

  return stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: participant.email,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tenantId,
      participantId: participant.id,
      eventId: participant.eventId
    },
    line_items: [
      {
        quantity: ticketCount,
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: participant.event.title,
            description: `Registration for ${participant.event.title}`
          },
          unit_amount: Math.round((amountNumber / ticketCount) * 100)
        }
      }
    ]
  });
}

