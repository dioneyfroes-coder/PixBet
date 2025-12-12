import { sendApiRequest } from '../core/client';
import type { ApiSuccessResponse } from '../types';
import {
  CreditPackageListSchema,
  CreditPackagePurchasePayloadSchema,
  CreditPackagePurchaseResponseSchema,
  CreateWithdrawalRequestSchema,
  CreateWithdrawalRequestResponseSchema,
  WithdrawalRequestListSchema,
  type CreditPackagePurchasePayload,
  type CreditPackagePurchaseSnapshot,
  type CreditPackageSnapshot,
  type CreateWithdrawalRequestPayload,
  type WithdrawalRequestSnapshot,
} from '../schemas';
import type { AuthenticatedRequestOptions } from './types';

const withAuth = (options: AuthenticatedRequestOptions = {}) => ({
  token: options.token,
  bypassUserId: options.bypassUserId,
});

/** Operações relacionadas a pacotes de crédito e solicitações de saque. */
export const financeApi = {
  listPackages: (
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<CreditPackageSnapshot[]>> =>
    sendApiRequest<CreditPackageSnapshot[]>('/finance/packages', {
      method: 'GET',
      ...withAuth(options),
      responseSchema: CreditPackageListSchema,
    }),
  purchasePackage: (
    packageId: string,
    payload: CreditPackagePurchasePayload,
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<CreditPackagePurchaseSnapshot>> =>
    sendApiRequest<CreditPackagePurchaseSnapshot, CreditPackagePurchasePayload>(
      `/finance/packages/${packageId}/purchase`,
      {
        method: 'POST',
        body: payload,
        bodySchema: CreditPackagePurchasePayloadSchema,
        responseSchema: CreditPackagePurchaseResponseSchema,
        ...withAuth(options),
      }
    ),
  createWithdrawalRequest: (
    payload: CreateWithdrawalRequestPayload,
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<WithdrawalRequestSnapshot>> =>
    sendApiRequest<WithdrawalRequestSnapshot, CreateWithdrawalRequestPayload>(
      '/finance/withdrawal-requests',
      {
        method: 'POST',
        body: payload,
        bodySchema: CreateWithdrawalRequestSchema,
        responseSchema: CreateWithdrawalRequestResponseSchema,
        ...withAuth(options),
      }
    ),
  listWithdrawalRequests: (
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<WithdrawalRequestSnapshot[]>> =>
    sendApiRequest<WithdrawalRequestSnapshot[]>('/finance/withdrawal-requests', {
      method: 'GET',
      ...withAuth(options),
      responseSchema: WithdrawalRequestListSchema,
    }),
};
