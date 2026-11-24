import { browserNetworkStatus } from './network-status';

function fakeWindow(onLine: boolean) {
  const target = new EventTarget();
  return Object.assign(target, { navigator: { onLine } }) as unknown as Window;
}

describe('browserNetworkStatus', () => {
  it('reads navigator.onLine', async () => {
    expect(await browserNetworkStatus(fakeWindow(true)).online()).toBe(true);
    expect(await browserNetworkStatus(fakeWindow(false)).online()).toBe(false);
  });

  it('counts a missing window as online', async () => {
    expect(await browserNetworkStatus(null).online()).toBe(true);
  });

  it('reports the online and offline events until stopped', () => {
    const win = fakeWindow(true);
    const seen: boolean[] = [];
    const stop = browserNetworkStatus(win).watch((online) => seen.push(online));

    win.dispatchEvent(new Event('offline'));
    win.dispatchEvent(new Event('online'));
    stop();
    win.dispatchEvent(new Event('offline'));

    expect(seen).toEqual([false, true]);
  });
});
