import { sendApiRequest } from '../core/client';

type HomeContent = Record<string, unknown> | null;

export async function getHomeContent(): Promise<HomeContent> {
  const { data } = await sendApiRequest<HomeContent>('/home', { method: 'GET' });
  return data ?? null;
}

export default { getHomeContent };
