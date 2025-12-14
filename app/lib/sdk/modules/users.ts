import { sendApiRequest } from '../core/client';
import { ApiClientError } from '../core/errors';
import { z } from 'zod';
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

const PreferencesSchema = z
  .object({
    emailNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
    marketingEmails: z.boolean().optional(),
  })
  .passthrough();

const PreferencesUpdateSchema = PreferencesSchema.partial();

export type PreferencesSnapshot = z.infer<typeof PreferencesSchema>;

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
  ): Promise<ApiSuccessResponse<UserProfile | null | undefined>> =>
    sendApiRequest<UserProfile | null | undefined, ProfileMutationPayload>('/users/me', {
      method: 'PATCH',
      body: payload,
      bodySchema: ProfileMutationSchema,
      // allow backends that return empty/204 responses for profile update
      responseSchema: z.union([UserProfileSchema, z.null(), z.any()]).optional(),
      ...withAuth(options),
    }),
  patchProfile: (
    payload: Record<string, string>,
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<UserProfile | null | undefined>> =>
    sendApiRequest<UserProfile | null | undefined, Record<string, string>>('/users/me', {
      method: 'PATCH',
      body: payload,
      bodySchema: z.record(z.string(), z.string()),
      responseSchema: z.union([UserProfileSchema, z.null(), z.any()]).optional(),
      ...withAuth(options),
    }),
  updateEmail: (
    payload: EmailUpdatePayload,
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<UserProfile | null | undefined>> =>
    sendApiRequest<UserProfile | null | undefined, EmailUpdatePayload>('/users/me/email', {
      method: 'PATCH',
      body: payload,
      bodySchema: EmailUpdateSchema,
      // allow backends that return empty/204 responses for email update
      responseSchema: z.union([UserProfileSchema, z.null(), z.any()]).optional(),
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
  updateNotifications: (
    payload: Record<string, boolean>,
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<Record<string, boolean>>> =>
    (async () => {
      const schema = z.record(z.string(), z.boolean());
      const paths = ['/users/me/notifications', '/users/notifications'];
      for (const path of paths) {
        try {
          return await sendApiRequest<Record<string, boolean>, Record<string, boolean>>(path, {
            method: 'PUT',
            body: payload,
            bodySchema: schema,
            ...withAuth(options),
          });
        } catch (error) {
          if (error instanceof ApiClientError && error.status === 404) {
            continue;
          }
          throw error;
        }
      }
      throw new ApiClientError('Endpoint de notificações indisponível', { status: 404 });
    })(),
  getPreferences: (
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<PreferencesSnapshot>> =>
    sendApiRequest<PreferencesSnapshot>('/users/me/preferences', {
      method: 'GET',
      responseSchema: PreferencesSchema,
      ...withAuth(options),
    }),
  updatePreferences: (
    payload: Partial<PreferencesSnapshot>,
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<PreferencesSnapshot>> =>
    sendApiRequest<PreferencesSnapshot, Partial<PreferencesSnapshot>>('/users/me/preferences', {
      method: 'PUT',
      body: payload,
      bodySchema: PreferencesUpdateSchema,
      responseSchema: PreferencesSchema,
      ...withAuth(options),
    }),
  changePassword: async (
    payload: { currentPassword: string; newPassword: string },
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<null>> => {
    const schema = z.object({
      currentPassword: z.string().min(6, 'Senha inválida'),
      newPassword: z.string().min(6, 'Senha inválida'),
    });
    try {
      return await sendApiRequest<null, typeof payload>('/users/me/password', {
        method: 'POST',
        body: payload,
        bodySchema: schema,
        ...withAuth(options),
      });
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 404) {
        return sendApiRequest<null, typeof payload>('/users/password', {
          method: 'POST',
          body: payload,
          bodySchema: schema,
          ...withAuth(options),
        });
      }
      throw error;
    }
  },
  deleteAccount: (options: AuthenticatedRequestOptions = {}) =>
    sendApiRequest<null>('/users/me', {
      method: 'DELETE',
      ...withAuth(options),
    }),
  uploadDocuments: (
    form: FormData,
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<null>> =>
    sendApiRequest<null>('/users/me/documents', {
      method: 'POST',
      body: form,
      ...withAuth(options),
    }),
};
