import { describe, expect, it } from 'vitest';
import type { SaveRequest } from './save-bar';

describe('SaveBar logic', () => {
  it('formats save request accurately with replace flag', () => {
    let emitted: SaveRequest | null = null;
    const saveHandler = (req: SaveRequest) => {
      emitted = req;
    };

    const request: SaveRequest = { label: 'Spacing · M3 · 28 m', replace: true };
    saveHandler(request);

    expect(emitted).toEqual({
      label: 'Spacing · M3 · 28 m',
      replace: true,
    });
  });

  it('preserves user custom labels when replacing an existing result', () => {
    const customLabel = 'Custom Highway Lighting Spacing';
    const request: SaveRequest = { label: customLabel, replace: false };

    expect(request.label).toBe('Custom Highway Lighting Spacing');
    expect(request.replace).toBe(false);
  });
});
