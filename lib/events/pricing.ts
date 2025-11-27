import { Event, Prisma } from '@prisma/client';

export type PricingStrategy = 'EARLY_BIRD' | 'GROUP' | 'SINGLE';

export type PricingResult = {
  strategy: PricingStrategy;
  unitPrice: Prisma.Decimal;
  total: Prisma.Decimal;
};

export function calculateEventPrice(event: Event, ticketCount: number): PricingResult {
  if (ticketCount < 1) {
    throw new Error('ticketCount must be at least 1');
  }

  const now = new Date();
  const decimalTicketCount = new Prisma.Decimal(ticketCount);

  if (event.earlyBirdDeadline && event.earlyBirdDeadline >= now && event.earlyBirdPrice) {
    return {
      strategy: 'EARLY_BIRD',
      unitPrice: event.earlyBirdPrice,
      total: event.earlyBirdPrice.mul(decimalTicketCount)
    };
  }

  if (ticketCount >= 2 && event.priceGroup) {
    return {
      strategy: 'GROUP',
      unitPrice: event.priceGroup,
      total: event.priceGroup.mul(decimalTicketCount)
    };
  }

  if (event.priceSingle) {
    return {
      strategy: 'SINGLE',
      unitPrice: event.priceSingle,
      total: event.priceSingle.mul(decimalTicketCount)
    };
  }

  throw new Error('Event has no applicable pricing configured');
}


