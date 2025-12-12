import { getAccessToken } from '../../token';
import type { AuthenticatedRequestOptions } from '../modules/types';

export type AccessTokenOptions = {
  accessToken?: string | null;
  bypassUserId?: string | null;
};

const normalizeBypass = (id?: string | null) => (id && id.length > 0 ? id : undefined);

const fromExplicitToken = (
  token: string,
  bypassUserId?: string | null
): AuthenticatedRequestOptions => ({
  token,
  bypassUserId: normalizeBypass(bypassUserId),
});

export async function resolveAuthOptions(
  options?: AccessTokenOptions
): Promise<AuthenticatedRequestOptions> {
  if (options?.accessToken) {
    return fromExplicitToken(options.accessToken, options.bypassUserId);
  }

  const token = await getAccessToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente para continuar.');
  }

  return fromExplicitToken(token, options?.bypassUserId);
}

export async function resolveOptionalAuthOptions(
  options?: AccessTokenOptions
): Promise<AuthenticatedRequestOptions | undefined> {
  try {
    return await resolveAuthOptions(options);
  } catch {
    return undefined;
  }
}
