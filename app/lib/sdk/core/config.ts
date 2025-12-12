const sanitizeBaseUrl = (candidate?: string | null) => {
  if (!candidate) return '';
  const trimmed = candidate.trim();
  if (!trimmed) return '';
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};
const deriveOrigin = (baseUrl: string) => {
  try {
    const parsed = new URL(baseUrl);
    return parsed.origin;
  } catch {
    const match = baseUrl.match(/^(https?:\/\/[^/]+)/i);
    return match ? match[1] : baseUrl;
  }
};

export const apiRuntimeConfig = {
  baseUrl: '',
  originUrl: '',
};

export const updateApiBaseUrl = (nextUrl?: string | null) => {
  const sanitized = sanitizeBaseUrl(nextUrl);
  apiRuntimeConfig.baseUrl = sanitized;
  apiRuntimeConfig.originUrl = sanitized ? deriveOrigin(sanitized) : '';
};

export const ensureApiBaseUrl = () => {
  if (!apiRuntimeConfig.baseUrl) {
    throw new Error(
      'API base URL is not configured. Call updateApiBaseUrl(...) before making requests.'
    );
  }
  return apiRuntimeConfig.baseUrl;
};

export const ensureApiOriginUrl = () => {
  if (!apiRuntimeConfig.originUrl) {
    const base = ensureApiBaseUrl();
    apiRuntimeConfig.originUrl = deriveOrigin(base);
  }
  return apiRuntimeConfig.originUrl || ensureApiBaseUrl();
};
