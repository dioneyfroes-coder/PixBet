// Auto-generated from docs da backend/openapi.json — do not edit manually
import { z } from 'zod';

const currencyValues = ['BRL', 'USD', 'EUR'] as const;
export const CurrencyCode = z.enum(currencyValues);

export const Money = z.object({
  amount: z.number().int(),
  currency: CurrencyCode.default('BRL'),
});

const metaSchema = z
  .object({
    timestamp: z.string().datetime().optional(),
    requestId: z.string().optional(),
  })
  .passthrough()
  .optional();

const nullableData = <T extends z.ZodTypeAny>(schema: T) => z.union([schema, z.null()]);

const responseEnvelope = <T extends z.ZodTypeAny>(
  schema: T,
  options: { nullableData?: boolean } = {}
) => {
  const { nullableData: allowNull = true } = options;
  const dataSchema = allowNull ? nullableData(schema) : schema;
  return z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    meta: metaSchema,
  });
};

export const ValidationError = z.record(z.string(), z.string());
const errorDetailsSchema = z.union([ValidationError, z.record(z.string(), z.any())]);

export const User = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  status: z.enum(['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED'] as const),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

const walletMoney = Money.describe('Monetary value expressed in cents');
export const Wallet = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  balance: walletMoney,
  lockedBalance: walletMoney.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

export const WalletResponse = responseEnvelope(Wallet);

export const RegisterRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  username: z.string().min(3),
});

const authPayload = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: User,
});

export const AuthResponse = responseEnvelope(authPayload, { nullableData: false });

export const ErrorResponse = z.object({
  success: z.boolean().default(false),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: errorDetailsSchema.optional(),
    })
    .optional(),
  meta: metaSchema,
});

const registerPayload = z.object({
  message: z.string(),
  user: User,
  wallet: Wallet.optional(),
});

export const RegisterResponse = responseEnvelope(registerPayload, { nullableData: false });
export const MeResponse = responseEnvelope(User, { nullableData: false });

export const LogoutResponse = responseEnvelope(
  z.object({
    message: z.string(),
  }),
  { nullableData: false }
);

export const ConflictError = ErrorResponse;
export const UnauthorizedError = ErrorResponse;

export const AppError = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  details: errorDetailsSchema.optional(),
});

export const Transaction = z.object({
  id: z.string(),
  type: z.string(),
  reference: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  channel: z.string().optional(),
  amount: z.number().int(),
  currency: CurrencyCode.default('BRL'),
  createdAt: z.string().datetime(),
});

const transactionHistoryPayload = z.object({
  transactions: z.array(Transaction),
  total: z.number().int().nonnegative(),
});

export const TransactionHistory = responseEnvelope(transactionHistoryPayload, {
  nullableData: false,
});

export const PlaceBetRequest = z.object({
  eventId: z.string().uuid(),
  marketId: z.string(),
  oddId: z.string(),
  amount: z.number().positive(),
  type: z.enum(['SINGLE', 'MULTIPLE'] as const).optional(),
  currency: CurrencyCode.optional(),
});

export const CancelBetRequest = z.object({
  betId: z.string().uuid(),
  reason: z.string().optional(),
});

export const Bet = z.object({
  id: z.string(),
  userId: z.string().uuid().optional(),
  eventId: z.string(),
  marketId: z.string().optional(),
  oddId: z.string().optional(),
  amount: z.number(),
  currency: CurrencyCode.optional(),
  odds: z.number(),
  potentialReturn: z.number().optional(),
  status: z.enum(['PENDING', 'WON', 'LOST', 'CANCELED'] as const).optional(),
  type: z.enum(['SINGLE', 'MULTIPLE'] as const).optional(),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable().optional(),
  cancellationReason: z.string().nullable().optional(),
});

export const BetResponse = responseEnvelope(Bet, { nullableData: false });

const betListPayload = z.object({
  bets: z.array(Bet),
  total: z.number().int().nonnegative().optional(),
});

export const BetListResponse = responseEnvelope(betListPayload, { nullableData: false });

export const Market = z.object({
  id: z.string(),
  eventId: z.string().optional(),
  name: z.string().optional(),
  outcomes: z.array(z.string()).optional(),
  status: z.string().optional(),
});

export const MarketListResponse = responseEnvelope(
  z.object({
    markets: z.array(Market),
  }),
  { nullableData: false }
);

export const Odd = z.object({
  id: z.string(),
  marketId: z.string().optional(),
  price: z.number(),
  label: z.string().optional(),
});

export const OddsResponse = responseEnvelope(
  z.object({
    odds: z.array(Odd),
  }),
  { nullableData: false }
);

export const ReportRequest = z.object({
  type: z.string(),
  params: z.record(z.string(), z.any()).optional(),
});

export const Report = z.object({
  id: z.string().uuid(),
  status: z.enum(['PENDING', 'READY', 'FAILED'] as const),
  url: z.string().url().nullable().optional(),
  createdAt: z.string().datetime().optional(),
});

export const ReportResponse = responseEnvelope(Report, { nullableData: false });

const adminStatusSnapshot = z.object({
  uptime: z.number().nonnegative().optional(),
  version: z.string().optional(),
});

export const AdminStatus = responseEnvelope(adminStatusSnapshot);

export const AuditEntry = z.object({
  id: z.string().uuid(),
  action: z.string(),
  userId: z.string().uuid().optional(),
  meta: z.record(z.string(), z.any()).optional(),
  createdAt: z.string().datetime().optional(),
});

const auditListPayload = z.object({
  entries: z.array(AuditEntry),
  total: z.number().int().nonnegative().optional(),
});

export const AuditListResponse = responseEnvelope(auditListPayload, { nullableData: false });

export const schemas = {
  CurrencyCode,
  Money,
  User,
  Wallet,
  WalletResponse,
  RegisterRequest,
  AuthResponse,
  ErrorResponse,
  RegisterResponse,
  MeResponse,
  LogoutResponse,
  ConflictError,
  ValidationError,
  AppError,
  Transaction,
  TransactionHistory,
  UnauthorizedError,
  PlaceBetRequest,
  CancelBetRequest,
  Bet,
  BetResponse,
  BetListResponse,
  Market,
  MarketListResponse,
  Odd,
  OddsResponse,
  ReportRequest,
  Report,
  ReportResponse,
  AdminStatus,
  AuditEntry,
  AuditListResponse,
} as const;
