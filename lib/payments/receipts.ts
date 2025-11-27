import type { Prisma, PrismaClient } from '@prisma/client';

import { prisma } from '@/lib/db';

type CreateReceiptParams = {
  tenantId: string;
  participantId: string;
  amount: Prisma.Decimal;
  currency: string;
  paymentReference: string;
  metadata?: Record<string, unknown>;
};

type ReceiptClient = PrismaClient | Prisma.TransactionClient;

export async function ensureB2CReceipt(
  { tenantId, participantId, amount, currency, paymentReference, metadata }: CreateReceiptParams,
  client: ReceiptClient = prisma
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


