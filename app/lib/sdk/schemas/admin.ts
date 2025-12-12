import { z } from 'zod';
import { BetSchema } from './bets';

export const AdminOverviewSchema = z
  .object({
    totalUsers: z.number().optional(),
    activeBets: z.number().optional(),
    walletExposure: z.number().optional(),
    volume24h: z.number().optional(),
    services: z.record(z.string(), z.unknown()).optional(),
    generatedAt: z.string().optional(),
  })
  .passthrough();

export const RiskReportSchema = z
  .object({
    userId: z.string(),
    username: z.string().optional(),
    riskLevel: z.string().optional(),
    exposure: z.number().optional(),
    notes: z.string().optional(),
    recentBets: z.array(BetSchema).optional(),
  })
  .passthrough();

export const SettleBetPayloadSchema = z.object({
  outcome: z.string().min(1, 'Informe o resultado'),
});

export const EventStatusPayloadSchema = z.object({
  status: z.string().min(1, 'Informe o status'),
});

export type AdminOverviewSnapshot = z.infer<typeof AdminOverviewSchema>;
export type RiskReportSnapshot = z.infer<typeof RiskReportSchema>;
export type SettleBetPayload = z.infer<typeof SettleBetPayloadSchema>;
export type EventStatusPayload = z.infer<typeof EventStatusPayloadSchema>;
