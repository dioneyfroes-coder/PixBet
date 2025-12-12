import { sendApiRequest } from '../core/client';
import {
  AuthCredentialsSchema,
  AuthRegistrationSchema,
  AuthRefreshSchema,
  AuthSessionSchema,
  UserProfileSchema,
  type AuthCredentialsPayload,
  type AuthRegistrationPayload,
  type AuthRefreshPayload,
  type AuthSessionSnapshot,
  type UserProfile,
} from '../schemas';
import type { ApiSuccessResponse } from '../types';
import type { AuthenticatedRequestOptions } from './types';

/**
 * Funções de autenticação tipadas e validadas com Zod, centralizando as
 * interações dos formulários com o backend BackBet.
 */
export const authApi = {
  login: (credentials: AuthCredentialsPayload): Promise<ApiSuccessResponse<AuthSessionSnapshot>> =>
    sendApiRequest<AuthSessionSnapshot, AuthCredentialsPayload>('/auth/login', {
      method: 'POST',
      body: credentials,
      bodySchema: AuthCredentialsSchema,
      responseSchema: AuthSessionSchema,
    }),
  register: (payload: AuthRegistrationPayload): Promise<ApiSuccessResponse<AuthSessionSnapshot>> =>
    sendApiRequest<AuthSessionSnapshot, AuthRegistrationPayload>('/auth/register', {
      method: 'POST',
      body: payload,
      bodySchema: AuthRegistrationSchema,
      responseSchema: AuthSessionSchema,
    }),
  refresh: (payload: AuthRefreshPayload): Promise<ApiSuccessResponse<AuthSessionSnapshot>> =>
    sendApiRequest<AuthSessionSnapshot, AuthRefreshPayload>('/auth/refresh', {
      method: 'POST',
      body: payload,
      bodySchema: AuthRefreshSchema,
      responseSchema: AuthSessionSchema,
    }),
  me: (options: AuthenticatedRequestOptions = {}): Promise<ApiSuccessResponse<UserProfile>> =>
    sendApiRequest<UserProfile>('/auth/me', {
      method: 'GET',
      token: options.token,
      bypassUserId: options.bypassUserId,
      responseSchema: UserProfileSchema,
    }),
  logout: (
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<{ message?: string }>> =>
    sendApiRequest<{ message?: string }>('/auth/logout', {
      method: 'POST',
      token: options.token,
      bypassUserId: options.bypassUserId,
    }),
};
