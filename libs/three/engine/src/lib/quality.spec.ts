import { decideQuality, GpuInfo, QualitySignals } from '../quality';

const gpu: GpuInfo = {
  webgl2: true,
  softwareOnly: false,
  renderer: 'ANGLE (NVIDIA GeForce RTX 3060)',
};

const capable: QualitySignals = {
  override: null,
  reducedMotion: false,
  saveData: false,
  viewportWidth: 1440,
  cores: 8,
  memoryGb: 8,
  gpu,
};

describe('decideQuality', () => {
  it('gives a capable desktop the high tier', () => {
    expect(decideQuality(capable)).toBe('high');
  });

  it('gives integrated and mobile GPUs the low tier', () => {
    for (const renderer of [
      'ANGLE (Intel(R) UHD Graphics 620)',
      'Mali-G52',
      'Adreno (TM) 506',
    ]) {
      expect(decideQuality({ ...capable, gpu: { ...gpu, renderer } })).toBe(
        'low',
      );
    }
  });

  it.each<[string, Partial<QualitySignals>]>([
    ['reduced motion', { reducedMotion: true }],
    ['Save-Data', { saveData: true }],
    ['a phone-sized viewport', { viewportWidth: 390 }],
    ['two cores', { cores: 2 }],
    ['2 GB of memory', { memoryGb: 2 }],
    [
      'no WebGL2',
      { gpu: { webgl2: false, softwareOnly: false, renderer: '' } },
    ],
    ['a failed probe', { gpu: null }],
    [
      'software rendering',
      { gpu: { webgl2: true, softwareOnly: true, renderer: 'ANGLE' } },
    ],
    [
      'SwiftShader',
      {
        gpu: {
          webgl2: true,
          softwareOnly: false,
          renderer: 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device))',
        },
      },
    ],
  ])('falls back to the static view with %s', (_, signals) => {
    expect(decideQuality({ ...capable, ...signals })).toBe('off');
  });

  it('lets ?3d= override every heuristic except missing WebGL2', () => {
    const constrained = {
      ...capable,
      reducedMotion: true,
      viewportWidth: 390,
      gpu: { webgl2: true, softwareOnly: true, renderer: 'SwiftShader' },
    };

    expect(decideQuality({ ...constrained, override: 'on' })).toBe('high');
    expect(decideQuality({ ...constrained, override: 'low' })).toBe('low');
    expect(decideQuality({ ...capable, override: 'off' })).toBe('off');
    expect(
      decideQuality({
        ...capable,
        override: 'on',
        gpu: { webgl2: false, softwareOnly: false, renderer: '' },
      }),
    ).toBe('off');
  });
});
