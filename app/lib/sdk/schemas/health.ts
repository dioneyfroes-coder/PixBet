import { z } from 'zod';

const HealthObjectSchema = z
  .object({
    status: z.string().optional(),
    service: z.string().optional(),
    timestamp: z.string().optional(),
    version: z.string().optional(),
    uptime: z.number().optional(),
    details: z.record(z.string(), z.unknown()).optional(),
  })
  .catchall(z.unknown());

export const HealthResponseSchema = z.union([HealthObjectSchema, z.string()]);

export type HealthSnapshot = z.infer<typeof HealthResponseSchema>;
