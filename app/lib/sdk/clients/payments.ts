import { walletsApi } from '../modules';
import type {
  WalletDepositPayload,
  WalletOperationSnapshot,
  WalletWithdrawPayload,
} from '../schemas';
import type { PixRequest } from '../../../types/wallet';
import { resolveAuthOptions } from './_internal';

export type PixChannelCapabilities = {
  enabled: boolean;
  minAmount: number;
  maxAmount: number;
  reason?: string | null;
};

export type PixCapabilities = {
  deposit: PixChannelCapabilities;
  withdraw: PixChannelCapabilities;
};

export type PixDepositInput = {
  amount: number;
  currency?: string;
};

export type PixWithdrawalInput = {
  amount: number;
  currency?: string;
  pixKey: string;
  cpf?: string;
  rg?: string;
};

const SUPPORTED_CURRENCIES = ['BRL', 'USD', 'EUR'] as const;
type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const normalizeCurrency = (value?: string): SupportedCurrency => {
  if (value && SUPPORTED_CURRENCIES.includes(value.toUpperCase() as SupportedCurrency)) {
    return value.toUpperCase() as SupportedCurrency;
  }
  return 'BRL';
};

const generateRequestId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `pix-${Math.random().toString(36).slice(2, 10)}`;
};

const fallbackCapabilities: PixCapabilities = {
  deposit: { enabled: true, minAmount: 0, maxAmount: 0, reason: null },
  withdraw: { enabled: true, minAmount: 0, maxAmount: 0, reason: null },
};

export async function getPixCapabilities(): Promise<PixCapabilities> {
  // The backend exposes wallet summary under `/wallets/me` and does not
  // provide a dedicated `/wallets/pix/capabilities` endpoint. Use the
  // wallet summary to determine whether PIX flows are available; if the
  // server does not return capability metadata, fall back to sensible
  // defaults defined above.
  try {
    const authOptions = await resolveAuthOptions();
    const response = await walletsApi.getSummary(authOptions);
    const summary = response.data ?? null;
    if (!summary) return fallbackCapabilities;

    // If the backend provides explicit capability hints on the wallet
    // snapshot, map them. Otherwise, return fallback capabilities.
    // We defensively check common keys to avoid runtime errors.
    const deposit = (summary as Record<string, unknown>)['depositCapabilities'] as unknown;
    const withdraw = (summary as Record<string, unknown>)['withdrawCapabilities'] as unknown;
    if (deposit && withdraw && typeof deposit === 'object' && typeof withdraw === 'object') {
      const dep = deposit as Record<string, unknown>;
      const wit = withdraw as Record<string, unknown>;
      return {
        deposit: {
          enabled: Boolean((dep.enabled as boolean) ?? true),
          minAmount: typeof dep.minAmount === 'number' ? (dep.minAmount as number) : 0,
          maxAmount: typeof dep.maxAmount === 'number' ? (dep.maxAmount as number) : 0,
          reason: (dep.reason as string) ?? null,
        },
        withdraw: {
          enabled: Boolean((wit.enabled as boolean) ?? true),
          minAmount: typeof wit.minAmount === 'number' ? (wit.minAmount as number) : 0,
          maxAmount: typeof wit.maxAmount === 'number' ? (wit.maxAmount as number) : 0,
          reason: (wit.reason as string) ?? null,
        },
      };
    }

    return fallbackCapabilities;
  } catch {
    return fallbackCapabilities;
  }
}

const mapPixStatus = (status?: string | null): PixRequest['status'] => {
  if (!status) return 'pending';
  const normalized = status.toLowerCase();
  if (normalized.includes('confirm')) return 'confirmed';
  if (normalized.includes('expir')) return 'expired';
  return 'pending';
};

const toWalletDepositPayload = (input: PixDepositInput): WalletDepositPayload => ({
  // Backend expects amount in cents (integer). Convert BRL float to cents.
  amount: Math.round(input.amount * 100),
  currency: normalizeCurrency(input.currency),
});

const toWalletWithdrawPayload = (input: PixWithdrawalInput): WalletWithdrawPayload => {
  const descriptionParts: string[] = [];
  if (input.rg) descriptionParts.push(`RG: ${input.rg}`);
  if (input.cpf) descriptionParts.push(`CPF: ${input.cpf}`);
  const description = descriptionParts.length ? descriptionParts.join(' | ') : undefined;
  return {
    // send amount in cents
    amount: Math.round(input.amount * 100),
    currency: normalizeCurrency(input.currency),
    pixKey: input.pixKey,
    description,
  };
};

type PixChargeSnapshot = NonNullable<WalletOperationSnapshot['pix']>;

const mapPixChargeToRequest = (payload: PixChargeSnapshot, amount: number): PixRequest => ({
  id: payload.chargeId ?? payload.reference ?? generateRequestId(),
  code: payload.qrCode ?? payload.reference ?? '',
  copyPasteCode: payload.qrCode ?? payload.reference ?? '',
  amountCents: Math.round(Math.max(amount, 0) * 100),
  expiresAt: payload.expiresAt ?? new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  qrCode: payload.qrCode ?? null,
  status: mapPixStatus(payload.status),
});

export async function createPixDeposit(input: PixDepositInput): Promise<PixRequest | null> {
  const authOptions = await resolveAuthOptions();
  const response = await walletsApi.deposit(toWalletDepositPayload(input), authOptions);
  const pix = response.data?.pix;
  if (!pix) {
    return null;
  }
  return mapPixChargeToRequest(pix, input.amount);
}

export async function requestPixWithdrawal(input: PixWithdrawalInput): Promise<boolean> {
  const authOptions = await resolveAuthOptions();
  await walletsApi.withdraw(toWalletWithdrawPayload(input), authOptions);
  return true;
}

export default { getPixCapabilities, createPixDeposit, requestPixWithdrawal };
