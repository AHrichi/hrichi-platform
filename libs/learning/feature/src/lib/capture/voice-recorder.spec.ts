import { TestBed } from '@angular/core/testing';
import { VoiceRecorder } from './voice-recorder';

describe('VoiceRecorder', () => {
  it('starts idle with zero seconds and ignores stop/cancel when idle', async () => {
    TestBed.configureTestingModule({});
    const recorder = TestBed.inject(VoiceRecorder);

    expect(recorder.state()).toBe('idle');
    expect(recorder.seconds()).toBe(0);

    await expect(recorder.whenStopped()).resolves.toBeNull();
    await expect(recorder.stop()).resolves.toBeNull();
    recorder.cancel();
    expect(recorder.state()).toBe('idle');
  });

  it('reports unsupported cleanly if MediaRecorder is unavailable', async () => {
    const original = globalThis.MediaRecorder;
    vi.stubGlobal('MediaRecorder', undefined);
    try {
      TestBed.configureTestingModule({});
      const recorder = TestBed.inject(VoiceRecorder);
      expect(recorder.supported).toBe(false);

      await recorder.start();
      expect(recorder.state()).toBe('unsupported');
    } finally {
      vi.stubGlobal('MediaRecorder', original);
    }
  });
});
