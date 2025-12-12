import { walletsApi } from '../modules';
import type { WalletHistorySnapshot } from '../schemas';
import { resolveAuthOptions } from './_internal';

export type TransactionListResponse = {
  transactions: WalletHistorySnapshot['transactions'];
  total: number;
};

type TransactionQuery = {
  limit?: number;
  offset?: number;
};

export async function getTransactions(query?: TransactionQuery): Promise<TransactionListResponse> {
  const authOptions = await resolveAuthOptions();
  const { data } = await walletsApi.getHistory(authOptions, query);
  const transactions = data.transactions ?? [];
  const total = data.pagination?.total ?? transactions.length;
  return {
    transactions,
    total,
  };
}

export default { getTransactions };
