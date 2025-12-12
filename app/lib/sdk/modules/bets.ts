import { sendApiRequest } from '../core/client';
import type { ApiSuccessResponse } from '../types';
import {
  BetListSchema,
  BetSchema,
  CancelBetPayloadSchema,
  CancelBetResponseSchema,
  PlaceBetPayloadSchema,
  type BetListSnapshot,
  type BetSnapshot,
  type CancelBetPayload,
  type CancelBetResult,
  type PlaceBetPayload,
} from '../schemas';
import type { AuthenticatedRequestOptions } from './types';

const withAuth = (options: AuthenticatedRequestOptions = {}) => ({
  token: options.token,
  bypassUserId: options.bypassUserId,
});

export const betsApi = {
  listByEvent: (
    eventId: string,
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<BetListSnapshot>> =>
    sendApiRequest<BetListSnapshot>(`/bets/event/${eventId}`, {
      method: 'GET',
      ...withAuth(options),
      responseSchema: BetListSchema,
    }),
  listMyBets: (
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<BetListSnapshot>> =>
    sendApiRequest<BetListSnapshot>('/bets/me', {
      method: 'GET',
      ...withAuth(options),
      responseSchema: BetListSchema,
    }),
  placeBet: (
    payload: PlaceBetPayload,
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<BetSnapshot>> =>
    sendApiRequest<BetSnapshot, PlaceBetPayload>('/bets', {
      method: 'POST',
      body: payload,
      bodySchema: PlaceBetPayloadSchema,
      responseSchema: BetSchema,
      ...withAuth(options),
    }),
  cancelBet: (
    betId: string,
    payload: CancelBetPayload,
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<CancelBetResult>> =>
    sendApiRequest<CancelBetResult, CancelBetPayload>(`/bets/${betId}/cancel`, {
      method: 'POST',
      body: payload,
      bodySchema: CancelBetPayloadSchema,
      responseSchema: CancelBetResponseSchema,
      ...withAuth(options),
    }),
};
