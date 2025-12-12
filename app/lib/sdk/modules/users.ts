import { sendApiRequest } from '../core/client';
import {
  EmailUpdateSchema,
  ProfileMutationSchema,
  UserProfileSchema,
  UserPixKeyResponseSchema,
  UserPixKeyUpdateSchema,
  type EmailUpdatePayload,
  type ProfileMutationPayload,
  type UserProfile,
  type UserPixKeyPayload,
  type UserPixKeySnapshot,
} from '../schemas';
import type { ApiSuccessResponse } from '../types';
import type { AuthenticatedRequestOptions } from './types';

const withAuth = (options: AuthenticatedRequestOptions = {}) => ({
  token: options.token,
  bypassUserId: options.bypassUserId,
});

/** Requisições relacionadas ao perfil autenticado (dados e mutações básicas). */
export const usersApi = {
  getProfile: (
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<UserProfile>> =>
    sendApiRequest<UserProfile>('/users/me', {
      method: 'GET',
      ...withAuth(options),
      responseSchema: UserProfileSchema,
    }),
  getPixKey: (
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<UserPixKeySnapshot>> =>
    sendApiRequest<UserPixKeySnapshot>('/users/me/pix-key', {
      method: 'GET',
      ...withAuth(options),
      responseSchema: UserPixKeyResponseSchema,
    }),
  updateProfile: (
    payload: ProfileMutationPayload,
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<UserProfile>> =>
    sendApiRequest<UserProfile, ProfileMutationPayload>('/users/me', {
      method: 'PATCH',
      body: payload,
      bodySchema: ProfileMutationSchema,
      responseSchema: UserProfileSchema,
      ...withAuth(options),
    }),
  updateEmail: (
    payload: EmailUpdatePayload,
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<UserProfile>> =>
    sendApiRequest<UserProfile, EmailUpdatePayload>('/users/me/email', {
      method: 'PATCH',
      body: payload,
      bodySchema: EmailUpdateSchema,
      responseSchema: UserProfileSchema,
      ...withAuth(options),
    }),
  updatePixKey: (
    payload: UserPixKeyPayload,
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<UserPixKeySnapshot>> =>
    sendApiRequest<UserPixKeySnapshot, UserPixKeyPayload>('/users/me/pix-key', {
      method: 'PUT',
      body: payload,
      bodySchema: UserPixKeyUpdateSchema,
      responseSchema: UserPixKeyResponseSchema,
      ...withAuth(options),
    }),
};
