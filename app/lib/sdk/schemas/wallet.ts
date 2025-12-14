import { z } from 'zod';

const CurrencyEnumSchema = z.enum(['BRL', 'USD', 'EUR']);

const LegacyWalletSnapshotSchema = z
  .object({
    id: z.string().optional(),
    userId: z.string(),
    balance: z.coerce.number(),
    lockedBalance: z.coerce.number().optional(),
    currency: CurrencyEnumSchema.optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

const StructuredWalletSnapshotSchema = z
  .object({
    id: z.string().optional(),
    userId: z.string(),
    balance: z.object({
      amount: z.number(),
      currency: CurrencyEnumSchema,
    }),
    lockedBalance: z
      .object({
        amount: z.number(),
        currency: CurrencyEnumSchema.optional(),
      })
      .optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

const normalizeWalletSnapshot = (
  snapshot:
    | z.infer<typeof LegacyWalletSnapshotSchema>
    | z.infer<typeof StructuredWalletSnapshotSchema>
) => {
  const balanceValue =
    typeof snapshot.balance === 'object' ? snapshot.balance.amount : (snapshot.balance as number);

  const lockedBalanceValue =
    typeof snapshot.lockedBalance === 'object'
      ? snapshot.lockedBalance.amount
      : snapshot.lockedBalance;

  const currencyValue =
    'currency' in snapshot && snapshot.currency
      ? snapshot.currency
      : typeof snapshot.balance === 'object'
        ? snapshot.balance.currency
        : undefined;

  return {
    ...snapshot,
    balance: balanceValue,
    lockedBalance: lockedBalanceValue,
    currency: currencyValue,
  };
};

export const WalletSnapshotSchema = z
  .union([LegacyWalletSnapshotSchema, StructuredWalletSnapshotSchema])
  .transform((snapshot) => LegacyWalletSnapshotSchema.parse(normalizeWalletSnapshot(snapshot)));

export const WalletSummaryResponseSchema = z.union([
  WalletSnapshotSchema,
  z.object({ wallet: WalletSnapshotSchema }).passthrough(),
]);

const TransactionTypeSchema = z.enum(['DEPOSIT', 'WITHDRAW', 'BET', 'WINNINGS', 'LOCK', 'UNLOCK']);

const TransactionStatusSchema = z.enum(['PENDING', 'COMPLETED', 'FAILED', 'PROCESSING']);

const NormalizedTransactionTypeSchema = z
  .string()
  .transform((value) => value.toUpperCase())
  .pipe(TransactionTypeSchema);

const NormalizedTransactionStatusSchema = z
  .string()
  .transform((value) => value.toUpperCase())
  .pipe(TransactionStatusSchema);

export const WalletDepositRequestSchema = z.object({
  amount: z.number().positive('Valor deve ser maior que zero'),
  currency: CurrencyEnumSchema.default('BRL'),
  description: z.string().optional(),
});

export const WalletWithdrawRequestSchema = z.object({
  amount: z.number().positive('Valor deve ser maior que zero'),
  currency: CurrencyEnumSchema.default('BRL'),
  pixKey: z.string().min(5, 'Chave PIX inválida').optional(),
  password: z.string().min(1, 'Senha inválida').optional(),
  description: z.string().optional(),
});

export const PixChargeSchema = z
  .object({
    chargeId: z.string().optional(),
    reference: z.string().optional(),
    provider: z.string().optional(),
    status: z.string().optional(),
    qrCode: z.string().optional(),
    expiresAt: z.string().optional(),
    confirmedAt: z.string().optional(),
    payoutId: z.string().optional(),
    processedAt: z.string().optional(),
  })
  .passthrough();

export const WalletOperationResponseSchema = z
  .object({
    message: z.string().optional(),
    wallet: WalletSnapshotSchema,
    pix: PixChargeSchema.optional(),
  })
  .passthrough();

const WalletTransactionSchema = z
  .object({
    id: z.string(),
    walletId: z.string().optional(),
    userId: z.string().optional(),
    type: NormalizedTransactionTypeSchema,
    amount: z.coerce.number().positive(),
    currency: CurrencyEnumSchema.optional(),
    description: z.string().optional(),
    status: NormalizedTransactionStatusSchema.optional(),
    createdAt: z.string(),
  })
  .passthrough()
  .transform((transaction) => ({
    ...transaction,
    type: transaction.type,
    status: transaction.status,
  }));

export const WalletHistorySchema = z.object({
  transactions: z.array(WalletTransactionSchema).optional(),
  pagination: z
    .object({
      limit: z.coerce.number().optional(),
      offset: z.coerce.number().optional(),
      total: z.coerce.number().optional(),
    })
    .passthrough()
    .optional(),
});

export type WalletDepositPayload = z.infer<typeof WalletDepositRequestSchema>;
export type WalletWithdrawPayload = z.infer<typeof WalletWithdrawRequestSchema>;
export type WalletHistorySnapshot = z.infer<typeof WalletHistorySchema>;
export type WalletOperationSnapshot = z.infer<typeof WalletOperationResponseSchema>;
export type WalletSnapshot = z.infer<typeof WalletSnapshotSchema>;
export type WalletSummaryResponse = z.infer<typeof WalletSummaryResponseSchema>;
