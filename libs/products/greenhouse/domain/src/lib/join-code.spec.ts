import { cleanJoinCode, formatJoinCode, joinCodeLive } from './join-code';

describe('cleanJoinCode', () => {
  it('accepts a code typed loosely', () => {
    expect(cleanJoinCode('abcd-efgh')).toBe('ABCDEFGH');
    expect(cleanJoinCode(' K7QX M2PD ')).toBe('K7QXM2PD');
  });

  it('refuses what cannot be a code', () => {
    expect(cleanJoinCode('')).toBeNull();
    expect(cleanJoinCode('ABCDEFG')).toBeNull();
    expect(cleanJoinCode('ABCDEFGHJ')).toBeNull();
    // 0, O, 1 and I are never used.
    expect(cleanJoinCode('ABCDEFG0')).toBeNull();
    expect(cleanJoinCode('ABCDEFGI')).toBeNull();
  });
});

describe('formatJoinCode', () => {
  it('splits a code in two', () => {
    expect(formatJoinCode('K7QXM2PD')).toBe('K7QX-M2PD');
  });

  it('leaves anything else alone', () => {
    expect(formatJoinCode('ABC')).toBe('ABC');
  });
});

describe('joinCodeLive', () => {
  it('is true until the expiry', () => {
    const now = new Date('2026-11-25T10:00:00Z');
    expect(joinCodeLive('2026-11-25T10:00:01Z', now)).toBe(true);
    expect(joinCodeLive('2026-11-25T10:00:00Z', now)).toBe(false);
  });
});
