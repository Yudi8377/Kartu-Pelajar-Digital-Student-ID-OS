import { describe, expect, it } from 'vitest';
import { isCardVerifiable } from '../src/lib/card-status';

const now = new Date('2026-10-15T00:00:00.000Z');

describe('isCardVerifiable', () => {
  it('accepts an active card with no expiry', () => {
    expect(isCardVerifiable({ status: 'active', expiresAt: null, now })).toBe(true);
  });
  it('accepts an active card before expiry', () => {
    expect(isCardVerifiable({ status: 'active', expiresAt: new Date('2026-10-16T00:00:00.000Z'), now })).toBe(true);
  });
  it('rejects a card at or after expiry', () => {
    expect(isCardVerifiable({ status: 'active', expiresAt: now, now })).toBe(false);
  });
  it('rejects all non-active statuses', () => {
    for (const status of ['pending', 'revoked', 'expired', 'replaced'] as const) {
      expect(isCardVerifiable({ status, expiresAt: null, now })).toBe(false);
    }
  });
});
