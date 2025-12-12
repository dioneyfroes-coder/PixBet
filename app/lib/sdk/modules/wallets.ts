import { sendApiRequest } from '../core/client';
import {
  WalletDepositRequestSchema,
  WalletHistorySchema,
  WalletOperationResponseSchema,
  WalletWithdrawRequestSchema,
  WalletSummaryResponseSchema,
  type WalletDepositPayload,
  type WalletHistorySnapshot,
  type WalletOperationSnapshot,
  type WalletSnapshot,
  type WalletSummaryResponse,
  type WalletWithdrawPayload,
} from '../schemas';
import type { ApiSuccessResponse } from '../types';
import type { AuthenticatedRequestOptions } from './types';

interface WalletHistoryQuery {
  limit?: number;
  offset?: number;
}

const withAuth = (options: AuthenticatedRequestOptions = {}) => ({
  token: options.token,
  bypassUserId: options.bypassUserId,
});

const buildHistoryQuery = (
  query?: WalletHistoryQuery
): Record<string, string | number | boolean | undefined> | undefined =>
  query
    ? {
        limit: query.limit,
        offset: query.offset,
      }
    : undefined;

const hasNestedWallet = (payload: WalletSummaryResponse): payload is { wallet: WalletSnapshot } =>
  typeof payload === 'object' && payload !== null && 'wallet' in payload;

/** Fluxos de carteira do usuário (saldo, extrato e transações). */
export const walletsApi = {
  getSummary: async (
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<WalletSnapshot>> => {
    const response = await sendApiRequest<WalletSummaryResponse>('/wallets/me', {
      method: 'GET',
      ...withAuth(options),
      responseSchema: WalletSummaryResponseSchema,
    });

    const normalizedData = hasNestedWallet(response.data) ? response.data.wallet : response.data;

    return {
      data: normalizedData,
      meta: response.meta,
    };
  },
  getHistory: (
    options: AuthenticatedRequestOptions = {},
    query?: WalletHistoryQuery
  ): Promise<ApiSuccessResponse<WalletHistorySnapshot>> =>
    sendApiRequest<WalletHistorySnapshot>('/wallets/history', {
      method: 'GET',
      ...withAuth(options),
      searchParams: buildHistoryQuery(query),
      responseSchema: WalletHistorySchema,
    }),
  deposit: (
    payload: WalletDepositPayload,
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<WalletOperationSnapshot>> =>
    sendApiRequest<WalletOperationSnapshot, WalletDepositPayload>('/wallets/deposit', {
      method: 'POST',
      body: payload,
      bodySchema: WalletDepositRequestSchema,
      responseSchema: WalletOperationResponseSchema,
      ...withAuth(options),
    }),
  withdraw: (
    payload: WalletWithdrawPayload,
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<WalletOperationSnapshot>> =>
    sendApiRequest<WalletOperationSnapshot, WalletWithdrawPayload>('/wallets/withdraw', {
      method: 'POST',
      body: payload,
      bodySchema: WalletWithdrawRequestSchema,
      responseSchema: WalletOperationResponseSchema,
      ...withAuth(options),
    }),
};
