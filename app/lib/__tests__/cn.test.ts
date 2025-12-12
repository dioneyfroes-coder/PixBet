import { describe, expect, it } from 'vitest';
import { cn } from '../cn';

describe('cn', () => {
  it('joins only truthy class names', () => {
    const shouldInclude = false;
    expect(cn('one', shouldInclude ? 'two' : undefined, undefined, 'three')).toBe('one three');
  });

  it('returns empty string when all classes are falsey', () => {
    expect(cn(false, null, undefined, '')).toBe('');
  });
});
