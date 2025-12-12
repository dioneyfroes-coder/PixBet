import { z } from 'zod';

export const BetSelectionSchema = z
  .object({
    id: z.string().optional(),
    marketId: z.string().optional(),
    oddId: z.string().optional(),
    label: z.string().optional(),
    status: z.string().optional(),
    odds: z.number().optional(),
    result: z.string().optional(),
  })
  .passthrough();

export const BetSchema = z
  .object({
    id: z.string(),
    userId: z.string().optional(),
    eventId: z.string().optional(),
    marketId: z.string().optional(),
    amount: z.number(),
    currency: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    potentialReturn: z.number().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    selections: z.array(BetSelectionSchema).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const BetListSchema = z.array(BetSchema);

export const PlaceBetPayloadSchema = z.object({
  eventId: z.string(),
  marketId: z.string(),
  oddId: z.string(),
  amount: z.number().positive('Informe um valor maior que zero'),
  type: z.enum(['SINGLE', 'MULTIPLE', 'SYSTEM']).default('SINGLE'),
});

export const CancelBetPayloadSchema = z.object({
  reason: z.string().max(280).optional(),
});

export const CancelBetResponseSchema = BetSchema.or(
  z.object({
    message: z.string(),
  })
);

export type BetSnapshot = z.infer<typeof BetSchema>;
export type BetListSnapshot = z.infer<typeof BetListSchema>;
export type PlaceBetPayload = z.infer<typeof PlaceBetPayloadSchema>;
export type CancelBetPayload = z.infer<typeof CancelBetPayloadSchema>;
export type CancelBetResult = z.infer<typeof CancelBetResponseSchema>;
