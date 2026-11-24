import { InjectionToken, type Provider } from '@angular/core';
import { NETWORK_STATUS } from '../network/network-status';

// The kit's index brings its components, which Node can't compile.
const kit = vi.hoisted(() => ({ token: null as unknown }));
vi.mock('@ah/products/greenhouse/ui', async () => {
  const { InjectionToken } = await import('@angular/core');
  kit.token = new InjectionToken('NATIVE_BADGE_SCANNER');
  return { NATIVE_BADGE_SCANNER: kit.token };
});

const native = vi.hoisted(() => ({ platform: false }));
const scanner = vi.hoisted(() => ({
  available: true,
  scan: vi.fn(),
  install: vi.fn(),
  progress: null as null | ((event: { state: number }) => void),
}));
const network = vi.hoisted(() => ({
  connected: true,
  listener: null as null | ((status: { connected: boolean }) => void),
  removed: 0,
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => native.platform },
}));

vi.mock('@capacitor-mlkit/barcode-scanning', () => ({
  BarcodeFormat: { QrCode: 'QR_CODE' },
  GoogleBarcodeScannerModuleInstallState: {
    CANCELED: 3,
    COMPLETED: 4,
    FAILED: 5,
  },
  BarcodeScanner: {
    isGoogleBarcodeScannerModuleAvailable: async () => ({
      available: scanner.available,
    }),
    installGoogleBarcodeScannerModule: () => scanner.install(),
    addListener: async (
      _event: string,
      listener: (event: { state: number }) => void,
    ) => {
      scanner.progress = listener;
      return { remove: async () => (scanner.progress = null) };
    },
    scan: (options: unknown) => scanner.scan(options),
  },
}));

vi.mock('@capacitor/network', () => ({
  Network: {
    getStatus: async () => ({ connected: network.connected }),
    addListener: async (
      _event: string,
      listener: (status: { connected: boolean }) => void,
    ) => {
      network.listener = listener;
      return { remove: async () => void network.removed++ };
    },
  },
}));

const {
  capacitorNetwork,
  googleCodeScanner,
  isCancelled,
  provideNativeDevice,
} = await import('./native-device');

const tokenOf = (p: Provider) => (p as { provide: unknown }).provide;

beforeEach(() => {
  native.platform = false;
  scanner.available = true;
  scanner.scan.mockReset();
  scanner.install.mockReset();
  network.connected = true;
  network.listener = null;
  network.removed = 0;
});

describe('provideNativeDevice', () => {
  it('provides nothing in a browser', () => {
    expect(provideNativeDevice()).toEqual([]);
  });

  it('provides the scanner and the network status in the Android app', () => {
    native.platform = true;
    const tokens = provideNativeDevice().map(tokenOf);
    expect(tokens[0]).toBe(kit.token);
    expect(tokens[0]).toBeInstanceOf(InjectionToken);
    expect(tokens[1]).toBe(NETWORK_STATUS);
  });
});

describe('googleCodeScanner', () => {
  it('asks for QR codes and returns the first code read', async () => {
    scanner.scan.mockResolvedValue({
      barcodes: [{ rawValue: '' }, { rawValue: 'B-0042' }],
    });
    expect(await googleCodeScanner().scan()).toBe('B-0042');
    expect(scanner.scan).toHaveBeenCalledWith({ formats: ['QR_CODE'] });
    expect(scanner.install).not.toHaveBeenCalled();
  });

  it('returns null when the person backs out', async () => {
    scanner.scan.mockRejectedValue(new Error('scan canceled.'));
    expect(await googleCodeScanner().scan()).toBeNull();
  });

  it('passes on any other failure', async () => {
    scanner.scan.mockRejectedValue(new Error('camera broken'));
    await expect(googleCodeScanner().scan()).rejects.toThrow('camera broken');
  });

  it('installs the scanner module first when it is missing', async () => {
    scanner.available = false;
    scanner.install.mockImplementation(async () => {
      scanner.progress?.({ state: 4 });
    });
    scanner.scan.mockResolvedValue({ barcodes: [{ rawValue: 'B-7' }] });
    expect(await googleCodeScanner().scan()).toBe('B-7');
    expect(scanner.install).toHaveBeenCalledOnce();
    expect(scanner.progress).toBeNull();
  });

  it('fails, so the badge is typed, when the module cannot be installed', async () => {
    scanner.available = false;
    scanner.install.mockImplementation(async () => {
      scanner.progress?.({ state: 5 });
    });
    await expect(googleCodeScanner().scan()).rejects.toThrow();
    expect(scanner.scan).not.toHaveBeenCalled();
  });
});

describe('isCancelled', () => {
  it('recognises the plugin’s cancel message', () => {
    expect(isCancelled(new Error('scan canceled.'))).toBe(true);
    expect(isCancelled('Cancelled by user')).toBe(true);
    expect(isCancelled(new Error('no camera'))).toBe(false);
  });
});

describe('capacitorNetwork', () => {
  it('reads the phone’s connection', async () => {
    network.connected = false;
    expect(await capacitorNetwork().online()).toBe(false);
  });

  it('reports changes until stopped', async () => {
    const seen: boolean[] = [];
    const stop = capacitorNetwork().watch((online) => seen.push(online));
    await vi.waitFor(() => expect(network.listener).not.toBeNull());

    network.listener?.({ connected: false });
    stop();
    network.listener?.({ connected: true });

    expect(seen).toEqual([false]);
    await vi.waitFor(() => expect(network.removed).toBe(1));
  });
});
