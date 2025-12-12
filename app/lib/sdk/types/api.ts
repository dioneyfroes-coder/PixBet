import type { z } from 'zod';
import type { HttpMethod } from './http';
import { ApiErrorDescriptorSchema, ApiMetadataSchema } from '../schemas';

export type ApiMetadata = z.infer<typeof ApiMetadataSchema>;

export type ApiErrorDescriptor = z.infer<typeof ApiErrorDescriptorSchema>;

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorDescriptor;
  meta?: ApiMetadata;
}

export interface ApiRequestConfig {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
  bypassUserId?: string;
  searchParams?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  target?: 'api' | 'origin';
  onResponsePayload?: (payload: unknown) => void;
}

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: ApiMetadata;
}
