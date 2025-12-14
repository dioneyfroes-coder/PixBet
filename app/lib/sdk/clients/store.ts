import { sendApiRequest } from '../core/client';
import { resolveAuthOptions } from './_internal';

export type StoreItem = {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  price?: number | string;
  currency?: string;
  available?: boolean;
  metadata?: Record<string, unknown> | null;
};

export async function getStoreItems(): Promise<StoreItem[]> {
  const authOptions = await resolveAuthOptions();
  const { data } = await sendApiRequest<StoreItem[]>('/store/items', {
    method: 'GET',
    token: authOptions.token,
  });
  return Array.isArray(data) ? data : [];
}

export default { getStoreItems };
