import { ApiClientError } from './core/errors';

type ApiClientInit = ConstructorParameters<typeof ApiClientError>[1];

export class ApiError extends ApiClientError {
  constructor(
    message: string,
    statusOrInit?: number | ApiClientInit,
    details?: Record<string, unknown> | null
  ) {
    if (typeof statusOrInit === 'number' || statusOrInit == null) {
      super(message, {
        status: typeof statusOrInit === 'number' ? statusOrInit : 500,
        details: details ?? undefined,
        payload: details ?? undefined,
      });
      return;
    }

    super(message, statusOrInit);
  }
}

export * from './core/errors';
