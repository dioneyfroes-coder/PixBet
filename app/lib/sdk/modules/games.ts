import { sendApiRequest } from '../core/client';
import type { ApiSuccessResponse } from '../types';
import {
  CoinFlipConfigSchema,
  CoinFlipFeedSchema,
  CoinFlipHistorySchema,
  CoinFlipPlayPayloadSchema,
  CoinFlipPlayResponseSchema,
  GamesListSchema,
  type CoinFlipConfigSnapshot,
  type CoinFlipFeedSnapshot,
  type CoinFlipHistorySnapshot,
  type CoinFlipPlayPayload,
  type CoinFlipPlaySnapshot,
  type GamesListSnapshot,
} from '../schemas';
import type { AuthenticatedRequestOptions } from './types';

const withAuth = (options: AuthenticatedRequestOptions = {}) => ({
  token: options.token,
  bypassUserId: options.bypassUserId,
});

export const gamesApi = {
  listGames: (): Promise<ApiSuccessResponse<GamesListSnapshot>> =>
    sendApiRequest<GamesListSnapshot>('/games', {
      method: 'GET',
      responseSchema: GamesListSchema,
    }),
  getCoinFlipConfig: (): Promise<ApiSuccessResponse<CoinFlipConfigSnapshot>> =>
    sendApiRequest<CoinFlipConfigSnapshot>('/games/coin-flip', {
      method: 'GET',
      responseSchema: CoinFlipConfigSchema,
    }),
  getCoinFlipFeed: (): Promise<ApiSuccessResponse<CoinFlipFeedSnapshot>> =>
    sendApiRequest<CoinFlipFeedSnapshot>('/games/coin-flip/feed', {
      method: 'GET',
      responseSchema: CoinFlipFeedSchema,
    }),
  getCoinFlipHistory: (
    params: { limit?: number; offset?: number } = {},
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<CoinFlipHistorySnapshot>> =>
    sendApiRequest<CoinFlipHistorySnapshot>('/games/coin-flip/history', {
      method: 'GET',
      searchParams: {
        limit: params.limit,
        offset: params.offset,
      },
      ...withAuth(options),
      responseSchema: CoinFlipHistorySchema,
    }),
  playCoinFlip: (
    payload: CoinFlipPlayPayload,
    options: AuthenticatedRequestOptions = {}
  ): Promise<ApiSuccessResponse<CoinFlipPlaySnapshot>> =>
    sendApiRequest<CoinFlipPlaySnapshot, CoinFlipPlayPayload>('/games/coin-flip/play', {
      method: 'POST',
      body: payload,
      bodySchema: CoinFlipPlayPayloadSchema,
      responseSchema: CoinFlipPlayResponseSchema,
      ...withAuth(options),
    }),
};
