import { guessDeviceName } from './device-name';

describe('guessDeviceName', () => {
  it.each([
    [
      'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/142.0 Mobile Safari/537.36',
      'Android phone',
    ],
    [
      'Mozilla/5.0 (Linux; Android 15; SM-X710) AppleWebKit/537.36 Chrome/142.0 Safari/537.36',
      'Android tablet',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142.0 Safari/537.36',
      'Windows PC',
    ],
    ['Mozilla/5.0 (X11; Linux x86_64) Firefox/145.0', 'Linux PC'],
    ['curl/8.0', 'This device'],
  ])('names %s', (userAgent, name) => {
    expect(guessDeviceName(userAgent)).toBe(name);
  });
});
