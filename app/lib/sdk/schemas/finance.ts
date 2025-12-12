import { z } from 'zod';
import { WalletSnapshotSchema } from './wallet';

export const CreditPackageSchema = z
  .object({
    id: z.string(),
    code: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    baseAmount: z.coerce.number(),
    bonusAmount: z.coerce.number(),
    totalCredits: z.coerce.number(),
    price: z.coerce.number(),
    currency: z.string(),
    isActive: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export const CreditPackageListSchema = z.array(CreditPackageSchema);

export const CreditPackagePurchasePayloadSchema = z.object({
  packageId: z.string().min(1, 'Informe o pacote desejado'),
});

export const CreditPackagePurchaseResponseSchema = z.object({
  creditPackage: CreditPackageSchema,
  wallet: WalletSnapshotSchema,
});

export const CreateWithdrawalRequestSchema = z.object({
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  currency: z.string().default('BRL'),
  notes: z.string().max(280).optional(),
});

export const ApprovalLogSchema = z
  .object({
    id: z.string().optional(),
    adminId: z.string().optional(),
    action: z.string(),
    notes: z.string().optional(),
    createdAt: z.string().optional(),
  })
  .passthrough();

export const WithdrawalRequestSchema = z
  .object({
    id: z.string(),
    userId: z.string().optional(),
    amount: z.coerce.number(),
    currency: z.string(),
    status: z.string(),
    notes: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    requestedAt: z.string().optional(),
    processedAt: z.string().nullable().optional(),
    approvalLogs: z.array(ApprovalLogSchema).optional(),
  })
  .passthrough();

export const WithdrawalRequestListSchema = z.array(WithdrawalRequestSchema);

export const CreateWithdrawalRequestResponseSchema = z
  .object({
    message: z.string().optional(),
    withdrawalRequest: WithdrawalRequestSchema,
  })
  .passthrough()
  .transform((payload) => payload.withdrawalRequest);

export type CreditPackageSnapshot = z.infer<typeof CreditPackageSchema>;
export type CreditPackagePurchasePayload = z.infer<typeof CreditPackagePurchasePayloadSchema>;
export type CreditPackagePurchaseSnapshot = z.infer<typeof CreditPackagePurchaseResponseSchema>;
export type CreateWithdrawalRequestPayload = z.infer<typeof CreateWithdrawalRequestSchema>;
export type WithdrawalRequestSnapshot = z.infer<typeof WithdrawalRequestSchema>;
