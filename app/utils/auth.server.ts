import { redirect, type ActionFunctionArgs } from 'react-router';
import { readTokensFromCookies } from '../lib/token';

export type ServerAuthContext = {
  accessToken: string;
};

export async function requireAuth(
  args: ActionFunctionArgs,
  redirectTo?: string
): Promise<ServerAuthContext> {
  const { request } = args;
  const { accessToken } = readTokensFromCookies(request.headers.get('cookie'));

  if (!accessToken) {
    const url = new URL(request.url);
    const fallback = redirectTo ?? url.pathname + url.search;
    const searchParams = new URLSearchParams();
    if (fallback) {
      searchParams.set('redirectTo', fallback);
    }
    const loginUrl = searchParams.toString() ? `/login?${searchParams.toString()}` : '/login';
    throw redirect(loginUrl);
  }

  return { accessToken };
}
