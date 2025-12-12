import { z } from 'zod';
import { WalletSnapshotSchema } from './wallet';

export const GameSchema = z
  .object({
    id: z.string(),
    slug: z.string().optional(),
    name: z.string().optional(),
    status: z.string().optional(),
    provider: z.string().optional(),
    createdAt: z.string().optional(),
  })
  .passthrough();

export const GamesListSchema = z.array(GameSchema);

export const CoinFlipConfigSchema = z
  .object({
    minBet: z.number().optional(),
    maxBet: z.number().optional(),
    houseEdge: z.number().optional(),
    currency: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough();

export const CoinFlipFeedEntrySchema = z
  .object({
    id: z.string().optional(),
    userAlias: z.string().optional(),
    choice: z.string().optional(),
    result: z.string().optional(),
    amount: z.number().optional(),
    payout: z.number().optional(),
    createdAt: z.string().optional(),
  })
  .passthrough();

export const CoinFlipFeedSchema = z.array(CoinFlipFeedEntrySchema);

export const CoinFlipHistorySchema = z
  .object({
    games: z.array(CoinFlipFeedEntrySchema).optional(),
    pagination: z
      .object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        total: z.number().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const CoinFlipChoiceSchema = z.enum(['HEADS', 'TAILS']);

export const CoinFlipPlayPayloadSchema = z.object({
  wager: z.coerce.number().positive('Informe um valor maior que zero'),
  choice: CoinFlipChoiceSchema,
});

export const CoinFlipPlayResponseSchema = z
  .object({
    roundId: z.string().optional(),
    choice: CoinFlipChoiceSchema.optional(),
    outcome: z.string().optional(),
    result: z.string().optional(),
    wager: z.coerce.number().optional(),
    payoutAmount: z.coerce.number().optional(),
    createdAt: z.string().optional(),
    wallet: WalletSnapshotSchema.optional(),
  })
  .passthrough();

export type GameSnapshot = z.infer<typeof GameSchema>;
export type GamesListSnapshot = z.infer<typeof GamesListSchema>;
export type CoinFlipConfigSnapshot = z.infer<typeof CoinFlipConfigSchema>;
export type CoinFlipFeedSnapshot = z.infer<typeof CoinFlipFeedSchema>;
export type CoinFlipHistorySnapshot = z.infer<typeof CoinFlipHistorySchema>;
export type CoinFlipPlayPayload = z.infer<typeof CoinFlipPlayPayloadSchema>;
export type CoinFlipPlaySnapshot = z.infer<typeof CoinFlipPlayResponseSchema>;
