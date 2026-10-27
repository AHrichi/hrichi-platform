/**
 * Chooses how much 3D a device gets (ADR-0011). This entry point never
 * imports three, so pages can decide before downloading anything.
 *
 * - `off`: show the static fallback; WebGL never loads
 * - `low`: pixel ratio capped at 1.25, no post-processing
 * - `high`: pixel ratio capped at 2, post-processing allowed
 */
export type QualityTier = 'off' | 'low' | 'high';

export interface GpuInfo {
  webgl2: boolean;
  /** True when the browser would only render in software. */
  softwareOnly: boolean;
  renderer: string;
}

export interface QualitySignals {
  /** `?3d=on|high|low|off`, for tests, Lighthouse and the Inspector. */
  override: string | null;
  reducedMotion: boolean;
  saveData: boolean;
  viewportWidth: number;
  cores?: number;
  memoryGb?: number;
  gpu: GpuInfo | null;
}

/** Below this width the hero is too small for 3D to be worth the battery. */
export const minViewportWidth = 768;

const softwareRenderer = /swiftshader|llvmpipe|software|basic render/i;
const modestGpu = /intel|mali|adreno \(tm\) [1-5]|adreno [1-5]|powervr/i;

export function decideQuality(signals: QualitySignals): QualityTier {
  const { gpu, override } = signals;
  if (!gpu?.webgl2 || override === 'off') {
    return 'off';
  }
  if (override === 'on' || override === 'high') {
    return 'high';
  }
  if (override === 'low') {
    return 'low';
  }
  if (
    signals.reducedMotion ||
    signals.saveData ||
    signals.viewportWidth < minViewportWidth ||
    (signals.cores !== undefined && signals.cores < 4) ||
    (signals.memoryGb !== undefined && signals.memoryGb < 4) ||
    gpu.softwareOnly ||
    softwareRenderer.test(gpu.renderer)
  ) {
    return 'off';
  }
  return modestGpu.test(gpu.renderer) ? 'low' : 'high';
}

interface NavigatorHints {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
}

export function readQualitySignals(window: Window): QualitySignals {
  const navigator = window.navigator as Navigator & NavigatorHints;
  return {
    override: new URL(window.location.href).searchParams.get('3d'),
    reducedMotion:
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    saveData: navigator.connection?.saveData === true,
    viewportWidth: window.innerWidth,
    cores: navigator.hardwareConcurrency || undefined,
    memoryGb: navigator.deviceMemory,
    gpu: probeGpu(window),
  };
}

export function detectQuality(window: Window): QualityTier {
  return decideQuality(readQualitySignals(window));
}

/** Opens a throwaway WebGL2 context, reads what it can, and releases it. */
function probeGpu(window: Window): GpuInfo | null {
  if (!('WebGL2RenderingContext' in window)) {
    return { webgl2: false, softwareOnly: false, renderer: '' };
  }
  const open = (failIfMajorPerformanceCaveat: boolean) =>
    window.document
      .createElement('canvas')
      .getContext('webgl2', { failIfMajorPerformanceCaveat });
  try {
    const fast = open(true);
    const gl = fast ?? open(false);
    if (!gl) {
      return { webgl2: false, softwareOnly: false, renderer: '' };
    }
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(
      gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ??
        '',
    );
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { webgl2: true, softwareOnly: !fast, renderer };
  } catch {
    return null;
  }
}
