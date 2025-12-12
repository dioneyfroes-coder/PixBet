import type { z } from 'zod';
import { AuthSessionSchema, UserProfileSchema, WalletSnapshotSchema } from '../schemas';

export type UserProfile = z.infer<typeof UserProfileSchema>;

export type WalletSnapshot = z.infer<typeof WalletSnapshotSchema>;

export type AuthSessionSnapshot = z.infer<typeof AuthSessionSchema>;
