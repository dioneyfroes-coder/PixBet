import { sendApiRequest } from '../core/client';
import type { ApiSuccessResponse } from '../types';
import {
  EventCategoriesSchema,
  EventCollectionSchema,
  EventMarketsListSchema,
  EventWithMarketsSchema,
} from '../schemas';
import type {
  EventCategorySnapshot,
  EventCollectionSnapshot,
  EventMarketSnapshot,
  EventWithMarketsSnapshot,
} from '../schemas';

export interface EventsQueryParams {
  limit?: number;
  offset?: number;
  categoryId?: string;
  status?: string;
}

const buildSearchParams = (
  params?: EventsQueryParams
): Record<string, string | number | boolean | undefined> | undefined =>
  params
    ? {
        limit: params.limit,
        offset: params.offset,
        categoryId: params.categoryId,
        status: params.status,
      }
    : undefined;

export const eventsApi = {
  list: (params?: EventsQueryParams): Promise<ApiSuccessResponse<EventCollectionSnapshot>> =>
    sendApiRequest<EventCollectionSnapshot>('/events', {
      method: 'GET',
      searchParams: buildSearchParams(params),
      responseSchema: EventCollectionSchema,
    }),
  listUpcoming: (
    params?: Pick<EventsQueryParams, 'limit' | 'offset'>
  ): Promise<ApiSuccessResponse<EventCollectionSnapshot>> =>
    sendApiRequest<EventCollectionSnapshot>('/events/upcoming', {
      method: 'GET',
      searchParams: buildSearchParams(params),
      responseSchema: EventCollectionSchema,
    }),
  getEvent: (eventId: string): Promise<ApiSuccessResponse<EventWithMarketsSnapshot>> =>
    sendApiRequest<EventWithMarketsSnapshot>(`/events/${eventId}`, {
      method: 'GET',
      responseSchema: EventWithMarketsSchema,
    }),
  getMarkets: (eventId: string): Promise<ApiSuccessResponse<EventMarketSnapshot[]>> =>
    sendApiRequest<EventMarketSnapshot[]>(`/events/${eventId}/markets`, {
      method: 'GET',
      responseSchema: EventMarketsListSchema,
    }),
  listCategories: (): Promise<ApiSuccessResponse<EventCategorySnapshot[]>> =>
    sendApiRequest<EventCategorySnapshot[]>('/events/categories', {
      method: 'GET',
      responseSchema: EventCategoriesSchema,
    }),
};
