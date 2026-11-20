import { TestBed } from '@angular/core/testing';
import { SdHud } from './hud';

describe('SdHud', () => {
  it('combines baseline HUD definitions with step metric values, tones and fresh flags', async () => {
    const fixture = TestBed.createComponent(SdHud);
    fixture.componentRef.setInput('hud', [
      { id: 'hit', label: 'Hit ratio', icon: 'gauge', value: '—' },
      { id: 'p50', label: 'p50', icon: 'timer', value: '—' },
      { id: 'err', label: 'Errors', icon: 'warning', value: '0%' },
    ]);
    fixture.componentRef.setInput('metrics', {
      hit: { value: '80%', tone: 'good' },
      err: { value: '12%', tone: 'bad' },
    });
    fixture.componentRef.setInput('fresh', new Set(['hit']));
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const hitChip = host.querySelector('[data-metric-id="hit"]');
    expect(hitChip?.getAttribute('data-tone')).toBe('good');
    expect(hitChip?.classList.contains('is-fresh')).toBe(true);
    expect(hitChip?.textContent).toContain('Hit ratio');
    expect(hitChip?.textContent).toContain('80%');

    const p50Chip = host.querySelector('[data-metric-id="p50"]');
    expect(p50Chip?.getAttribute('data-tone')).toBe('normal');
    expect(p50Chip?.textContent).toContain('—');

    const errChip = host.querySelector('[data-metric-id="err"]');
    expect(errChip?.getAttribute('data-tone')).toBe('bad');
    expect(errChip?.textContent).toContain('12%');
  });
});
