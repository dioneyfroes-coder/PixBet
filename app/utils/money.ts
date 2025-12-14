const formatterCache = new Map<string, Intl.NumberFormat>();

export function formatMoney(value: number, currency = 'BRL', locale = 'pt-BR') {
  const cacheKey = `${locale}:${currency}`;
  if (!formatterCache.has(cacheKey)) {
    formatterCache.set(cacheKey, new Intl.NumberFormat(locale, { style: 'currency', currency }));
  }
  const formatter = formatterCache.get(cacheKey)!;
  return formatter.format(value);
}

export function centsToDecimal(value?: number | null): number {
  if (value == null) return 0;
  return Number((value / 100).toFixed(2));
}

export function normalizeMoneyAmount(amount: number, decimals = 2): number {
  return Number(amount.toFixed(decimals));
}
