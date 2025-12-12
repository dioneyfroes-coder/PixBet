import { minDeposit, maxDeposit, minWithdrawal, maxWithdrawal } from '../config/env';

export const cfg = {
  // values in cents (ready-to-use numeric exports from env)
  MIN_DEPOSIT: minDeposit,
  MAX_DEPOSIT: maxDeposit,
  MIN_WITHDRAWAL: minWithdrawal,
  MAX_WITHDRAWAL: maxWithdrawal,
};

export function formatMoney(cents: number, locale = 'pt-BR', currency = 'BRL') {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
  } catch {
    // fallback
    return `R$ ${(cents / 100).toFixed(2)}`;
  }
}

export function formatMessage(template: string | undefined, vars: Record<string, string | number>) {
  if (!template) return '';
  return Object.keys(vars).reduce((acc, key) => {
    const value = String(vars[key]);
    return acc.split(`{${key}}`).join(value);
  }, template);
}

export default cfg;
