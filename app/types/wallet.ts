export type LiveChannel = 'PIX' | 'Web' | 'Automação';

export type TransactionType = 'deposit' | 'withdraw' | 'bonus';

export type TransactionStatus = 'confirmado' | 'processando' | 'aguardando' | 'falhou';

export type Transaction = {
  id: string;
  type: TransactionType;
  reference: string;
  amount: number; // value in reais (e.g. 250.00)
  amountCents: number; // value in cents (e.g. 25000)
  status: TransactionStatus;
  timestamp: string;
  channel: LiveChannel;
};

export type PixRequest = {
  id: string;
  code: string;
  copyPasteCode: string;
  amountCents: number;
  expiresAt: string;
  qrCode?: string | null;
  status: 'pending' | 'confirmed' | 'expired';
};
