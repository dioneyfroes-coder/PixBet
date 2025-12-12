import { z } from 'zod';

export const nonEmptyText = (label: string, min = 1, max = 120) =>
  z
    .string()
    .min(min, `${label} é obrigatório`)
    .max(max, `${label} deve ter no máximo ${max} caracteres`);

export const ApiMetadataSchema = z
  .object({
    timestamp: z.string().optional(),
    requestId: z.string().optional(),
  })
  .catchall(z.unknown());

export const ApiErrorDescriptorSchema = z.object({
  code: z.string().optional(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const createSuccessEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema.optional(),
    meta: ApiMetadataSchema.optional(),
  });

export const createErrorEnvelopeSchema = () =>
  z.object({
    success: z.literal(false),
    error: ApiErrorDescriptorSchema,
    meta: ApiMetadataSchema.optional(),
  });
