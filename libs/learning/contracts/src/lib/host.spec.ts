import {
  decodeConnect,
  decodeLink,
  encodeConnect,
  encodeLink,
  hostOrigins,
  hostReturnUrl,
  parseLink,
  textKey,
} from './host';

const studylm = 'https://product-studylm.ahmed-hrichi.workers.dev';
const token = `v1.0b6f0c30-0000-4000-8000-00000000000b.1800000000.${'a'.repeat(43)}`;

describe('connecting a host', () => {
  it('round-trips a request back to the host’s own address, without its fragment', () => {
    const fragment = `#link=${encodeConnect({
      app: 'studylm',
      returnTo: `${studylm}/stats#old`,
    })}`;
    expect(decodeConnect(fragment)).toEqual({
      app: 'studylm',
      returnTo: `${studylm}/stats`,
    });
  });

  it('refuses another site, an unknown app or a broken fragment', () => {
    expect(
      decodeConnect(
        `#link=${encodeConnect({ app: 'studylm', returnTo: 'https://evil.example/' })}`,
      ),
    ).toBeNull();
    expect(
      decodeConnect(
        `#link=${encodeConnect({ app: 'other' as 'studylm', returnTo: studylm })}`,
      ),
    ).toBeNull();
    expect(decodeConnect('#link=%%%')).toBeNull();
    expect(decodeConnect('#capture=abc')).toBeNull();
    expect(hostReturnUrl('studylm', 'not a url')).toBeNull();
    expect(hostReturnUrl('studylm', 'http://localhost:4307/flashcards')).toBe(
      'http://localhost:4307/flashcards',
    );
  });

  it('lists every host origin for CORS', () => {
    expect(hostOrigins()).toContain(studylm);
  });
});

describe('the link', () => {
  const link = { token, expiresAt: '2027-05-11T00:00:00.000Z' };

  it('round-trips in a fragment and in storage', () => {
    expect(decodeLink(`#learning-link=${encodeLink(link)}`)).toEqual(link);
    expect(parseLink(JSON.stringify(link))).toEqual(link);
  });

  it('refuses a malformed token or date', () => {
    expect(
      decodeLink(`#learning-link=${encodeLink({ ...link, token: 'nope' })}`),
    ).toBeNull();
    expect(
      parseLink(JSON.stringify({ ...link, expiresAt: 'soon' })),
    ).toBeNull();
    expect(parseLink('{')).toBeNull();
    expect(parseLink(null)).toBeNull();
  });
});

describe('textKey', () => {
  it('is short and stable, and tells texts apart', () => {
    expect(textKey('A queue.')).toMatch(/^[0-9a-f]{8}$/);
    expect(textKey('  A queue. ')).toBe(textKey('A queue.'));
    expect(textKey('A stack.')).not.toBe(textKey('A queue.'));
  });
});
