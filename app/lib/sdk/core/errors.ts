import type { ApiEnvelope, ApiErrorDescriptor, ApiMetadata } from '../types';
import type { ZodError } from 'zod';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: Record<string, unknown> | null;
  readonly meta?: ApiMetadata;
  readonly payload?: unknown;
  readonly isNetworkFailure: boolean;

  constructor(
    message: string,
    init: {
      status: number;
      code?: string;
      details?: Record<string, unknown> | null;
      meta?: ApiMetadata;
      payload?: unknown;
      isNetworkFailure?: boolean;
    }
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
    this.meta = init.meta;
    this.payload = init.payload;
    this.isNetworkFailure = init.isNetworkFailure ?? false;
  }
}

export const createResponseError = <T>(
  response: Response,
  payload?: ApiEnvelope<T> | null,
  rawBody?: string
) => {
  const descriptor: ApiErrorDescriptor | undefined = payload?.error;
  const message = descriptor?.message ?? `API responded with status ${response.status}`;

  return new ApiClientError(message, {
    status: response.status,
    code: descriptor?.code ?? response.statusText,
    details: descriptor?.details ?? null,
    meta: payload?.meta,
    payload: payload ?? rawBody ?? null,
  });
};

export const createNetworkError = (cause: unknown) =>
  new ApiClientError('Unable to reach API. Check the base URL and your network connection.', {
    status: 0,
    payload: cause,
    isNetworkFailure: true,
  });

export const summarizeClientError = (err: unknown): string => {
  if (err instanceof ApiClientError) {
    return err.message;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return typeof err === 'string' ? err : 'Unexpected error';
};

const formatSchemaIssues = (error: ZodError) =>
  error.issues.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`).join('; ') ||
  'Dados inválidos';

export const createSchemaValidationError = (
  stage: 'request' | 'response',
  error: ZodError,
  status = 0
) =>
  new ApiClientError(
    stage === 'request'
      ? 'Request payload failed client-side validation'
      : 'Response payload failed schema validation',
    {
      status,
      code: stage === 'request' ? 'REQUEST_VALIDATION_ERROR' : 'RESPONSE_VALIDATION_ERROR',
      details: { issues: error.flatten(), formatted: formatSchemaIssues(error) },
      payload: error,
    }
  );
