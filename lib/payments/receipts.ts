import type { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { getPrisma } from '@/lib/db';

type CreateReceiptParams = {
  tenantId: string;
  participantId: string;
  amount: Decimal;
  currency: string;
  paymentReference: string;
  metadata?: Record<string, unknown>;
};

type ReceiptClient = Pick<PrismaClient, 'receipt'>;

export async function ensureB2CReceipt(
  { tenantId, participantId, amount, currency, paymentReference, metadata }: CreateReceiptParams,
  client: ReceiptClient = getPrisma()
) {
  return client.receipt.upsert({
    where: { participantId },
    update: {
      amount,
      currency,
      metadata,
      paymentReference,
      tenantId,
      pdfUrl: null,
      type: 'B2C',
      issuedAt: new Date()
    },
    create: {
      tenantId,
      participantId,
      amount,
      currency,
      metadata,
      paymentReference,
      type: 'B2C',
      issuedAt: new Date()
    }
  });
}


