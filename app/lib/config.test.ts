import { describe, it, expect } from 'vitest';
import { formatMoney, formatMessage } from './config';

describe('formatMoney', () => {
  it('formats cents to BRL by default', () => {
    expect(formatMoney(1000)).toBe('R$ 10,00');
  });

  it('formats USD when requested', () => {
    const out = formatMoney(390, 'en-US', 'USD');
    expect(out).toBe('$3.90');
  });
});

describe('formatMessage', () => {
  it('replaces placeholders with values', () => {
    const tpl = 'Minimum deposit is {minDeposit} and max is {maxDeposit}';
    const res = formatMessage(tpl, { minDeposit: 'R$ 10,00', maxDeposit: 'R$ 15.000,00' });
    expect(res).toBe('Minimum deposit is R$ 10,00 and max is R$ 15.000,00');
  });

  it('returns empty string for undefined template', () => {
    expect(formatMessage(undefined, {})).toBe('');
  });
});
