import { z } from 'zod';
import { nonEmptyText } from './shared';
import { WalletSnapshotSchema } from './wallet';

export const UserProfileSchema = z
  .object({
    id: z.string(),
    email: z.string().email('Email inválido'),
    username: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    status: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export const AuthSessionSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
    sessionId: z.string().optional(),
    status: z.string().optional(),
    isActive: z.boolean().optional(),
    user: UserProfileSchema,
    wallet: WalletSnapshotSchema.optional(),
  })
  .passthrough();

export const AuthCredentialsSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha precisa de pelo menos 6 caracteres'),
});

export const AuthRegistrationSchema = AuthCredentialsSchema.extend({
  username: z.string().min(3, 'Username precisa de ao menos 3 caracteres'),
  firstName: nonEmptyText('Nome', 1, 60),
  lastName: nonEmptyText('Sobrenome', 1, 60),
});

export const AuthRefreshSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token inválido'),
});

export const ProfileMutationSchema = z
  .object({
    firstName: nonEmptyText('Nome').optional(),
    lastName: nonEmptyText('Sobrenome').optional(),
  })
  .refine((data) => data.firstName || data.lastName, {
    message: 'Informe ao menos um campo para atualizar',
  });

export const EmailUpdateSchema = z.object({
  email: z.string().email('Email inválido'),
});

const PixKeyValueSchema = z.string().min(3, 'Chave Pix inválida').max(180, 'Chave Pix inválida');

export const UserPixKeyResponseSchema = z
  .object({
    pixKey: z.union([PixKeyValueSchema, z.literal(''), z.null()]).optional(),
  })
  .passthrough();

export const UserPixKeyUpdateSchema = z.object({
  pixKey: z.union([PixKeyValueSchema, z.literal('')]),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type AuthSessionSnapshot = z.infer<typeof AuthSessionSchema>;
export type AuthCredentialsPayload = z.infer<typeof AuthCredentialsSchema>;
export type AuthRegistrationPayload = z.infer<typeof AuthRegistrationSchema>;
export type AuthRefreshPayload = z.infer<typeof AuthRefreshSchema>;
export type ProfileMutationPayload = z.infer<typeof ProfileMutationSchema>;
export type EmailUpdatePayload = z.infer<typeof EmailUpdateSchema>;
export type UserPixKeySnapshot = z.infer<typeof UserPixKeyResponseSchema>;
export type UserPixKeyPayload = z.infer<typeof UserPixKeyUpdateSchema>;
