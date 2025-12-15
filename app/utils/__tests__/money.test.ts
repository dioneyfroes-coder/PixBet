import { describe, it, expect } from 'vitest';
import { formatMoney, centsToDecimal, normalizeMoneyAmount } from '../money';

describe('money utils', () => {
  it('centsToDecimal converts cents to decimal with two digits', () => {
    expect(centsToDecimal(150)).toBe(1.5);
    expect(centsToDecimal(0)).toBe(0);
    expect(centsToDecimal(null)).toBe(0);
  });

  it('normalizeMoneyAmount rounds to provided decimals', () => {
    expect(normalizeMoneyAmount(1.2345)).toBe(1.23);
    expect(normalizeMoneyAmount(1.235, 2)).toBe(1.24);
    expect(normalizeMoneyAmount(1, 2)).toBe(1);
  });

  it('formatMoney returns a localized currency string', () => {
    const formatted = formatMoney(1234.5, 'BRL', 'pt-BR');
    // Should contain the currency symbol/abbrev and the numeric value
    expect(typeof formatted).toBe('string');
    expect(formatted).toMatch(/1\.234,50|R\$|BRL/);
  });
});
