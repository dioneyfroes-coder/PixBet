import { ensureApiBaseUrl, ensureApiOriginUrl } from './config';
import { createNetworkError, createResponseError, createSchemaValidationError } from './errors';
import type { ApiEnvelope, ApiRequestConfig, ApiSuccessResponse } from '../types';
import { ZodError, type ZodSchema } from 'zod';

type ValidatedRequestConfig<TResponse, TRequest> = ApiRequestConfig & {
  responseSchema?: ZodSchema<TResponse>;
  bodySchema?: ZodSchema<TRequest>;
};

const composeRequestUrl = (
  path: string,
  searchParams?: ApiRequestConfig['searchParams'],
  target: ApiRequestConfig['target'] = 'api'
) => {
  const isAbsolutePath = /^https?:\/\//i.test(path);
  const base = (() => {
    if (isAbsolutePath) return path;
    const normalizedPath = path.replace(/^\/+/, '');
    const selectedBase = target === 'origin' ? ensureApiOriginUrl() : ensureApiBaseUrl();
    const trimmedBase = selectedBase.replace(/\/+$/, '');
    const resourcePath = normalizedPath ? `/${normalizedPath}` : '';
    return `${trimmedBase}${resourcePath}`;
  })();
  const url = new URL(base);

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
};

const serializeRequestBody = (body: unknown, headers: Headers) => {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer) {
    return body as BodyInit;
  }

  headers.set('Content-Type', 'application/json');
  return JSON.stringify(body);
};

const resolveAuthorization = (config: ApiRequestConfig) => {
  if (config.token) {
    return `Bearer ${config.token}`;
  }

  if (config.bypassUserId) {
    return `Bearer ${config.bypassUserId}`;
  }

  return undefined;
};

const safeParseJson = <T>(raw: string): T | null => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const parseWithSchema = <T>(
  stage: 'request' | 'response',
  schema: ZodSchema<T>,
  payload: unknown,
  status = 0
) => {
  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw createSchemaValidationError(stage, error, status);
    }
    throw error;
  }
};

/**
 * Faz uma chamada HTTP padronizada para o backend BackBet aplicando validações opcionais
 * para o payload enviado (request) e recebido (response). Também injeta automaticamente
 * headers de autenticação, aplica tratamento de envelopes `{ success, data, meta }`
 * e traduz erros comuns em `ApiClientError`.
 */
export const sendApiRequest = async <TResponse = unknown, TRequest = unknown>(
  path: string,
  config: ValidatedRequestConfig<TResponse, TRequest> = {}
): Promise<ApiSuccessResponse<TResponse>> => {
  const method = config.method ?? 'GET';
  const headers = new Headers({
    Accept: 'application/json',
    ...(config.headers ?? {}),
  });
  const authorizationHeader = resolveAuthorization(config);
  if (authorizationHeader) {
    headers.set('Authorization', authorizationHeader);
  }

  const requestInit: RequestInit = {
    method,
    headers,
    signal: config.signal,
  };

  const normalizedBody = config.bodySchema
    ? parseWithSchema('request', config.bodySchema, config.body ?? {})
    : config.body;

  if (method !== 'GET' && method !== 'HEAD') {
    requestInit.body = serializeRequestBody(normalizedBody, headers);
  }

  const url = composeRequestUrl(path, config.searchParams, config.target);

  let response: Response;
  try {
    response = await fetch(url, requestInit);
  } catch (networkError) {
    throw createNetworkError(networkError);
  }

  const rawText = await response.text();
  const parsedEnvelope = rawText ? safeParseJson<ApiEnvelope<TResponse>>(rawText) : null;

  if (!response.ok || parsedEnvelope?.success === false) {
    throw createResponseError(response, parsedEnvelope, rawText);
  }

  const isEnvelope =
    parsedEnvelope && Object.prototype.hasOwnProperty.call(parsedEnvelope, 'success');

  const responsePayload = isEnvelope ? (parsedEnvelope?.data ?? null) : parsedEnvelope;

  if (config.onResponsePayload) {
    try {
      config.onResponsePayload(responsePayload);
    } catch (loggerError) {
      console.warn('onResponsePayload callback threw an error', loggerError);
    }
  }

  if (config.responseSchema) {
    const parsedData = parseWithSchema(
      'response',
      config.responseSchema,
      responsePayload,
      response.status
    );

    return {
      data: parsedData,
      meta: isEnvelope ? parsedEnvelope?.meta : undefined,
    };
  }

  if (isEnvelope) {
    return {
      data: (parsedEnvelope!.data as TResponse) ?? (parsedEnvelope as unknown as TResponse),
      meta: parsedEnvelope!.meta,
    };
  }

  if (parsedEnvelope) {
    return { data: parsedEnvelope as unknown as TResponse };
  }

  return { data: undefined as TResponse };
};
