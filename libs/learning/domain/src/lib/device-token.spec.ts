import {
  MIN_SECRET_LENGTH,
  signDeviceToken,
  verifyDeviceToken,
} from './device-token';
import { FIXTURE_IDS } from './testing/fixtures';

const secret = 'x'.repeat(MIN_SECRET_LENGTH);
const now = new Date('2026-11-11T08:00:00Z');
const expiresAt = new Date('2027-05-10T08:00:00Z');

describe('device tokens', () => {
  it('round-trips the claims', async () => {
    const token = await signDeviceToken(secret, {
      deviceId: FIXTURE_IDS.deviceA,
      expiresAt,
    });
    expect(token).toMatch(/^v1\.[0-9a-f-]{36}\.\d+\.[A-Za-z0-9_-]+$/);
    expect(await verifyDeviceToken(secret, token, now)).toEqual({
      deviceId: FIXTURE_IDS.deviceA,
      expiresAt,
    });
  });

  it('refuses an expired token, another secret, and any edit', async () => {
    const token = await signDeviceToken(secret, {
      deviceId: FIXTURE_IDS.deviceA,
      expiresAt,
    });
    expect(
      await verifyDeviceToken(secret, token, new Date('2027-05-10T08:00:00Z')),
    ).toBeNull();
    expect(await verifyDeviceToken('y'.repeat(40), token, now)).toBeNull();

    const swapped = token.replace(FIXTURE_IDS.deviceA, FIXTURE_IDS.deviceB);
    expect(await verifyDeviceToken(secret, swapped, now)).toBeNull();
    const [v, id, , sig] = token.split('.');
    const extended = [v, id, '9999999999', sig].join('.');
    expect(await verifyDeviceToken(secret, extended, now)).toBeNull();
  });

  it('refuses malformed tokens without throwing', async () => {
    for (const token of ['', 'v1', 'v2.a.1.b', 'v1.a.b.c', 'v1.a.1.***']) {
      expect(await verifyDeviceToken(secret, token, now)).toBeNull();
    }
  });

  it('insists on a long secret and a UUID device id', async () => {
    await expect(
      signDeviceToken('short', { deviceId: FIXTURE_IDS.deviceA, expiresAt }),
    ).rejects.toThrow(/at least 32/);
    await expect(
      signDeviceToken(secret, { deviceId: 'a.b', expiresAt }),
    ).rejects.toThrow(/UUID/);
  });
});
