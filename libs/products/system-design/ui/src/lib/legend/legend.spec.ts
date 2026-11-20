import { TestBed } from '@angular/core/testing';
import { SdLegend } from './legend';

describe('SdLegend', () => {
  it('renders all six packet kinds with dot, ring (handshake) and square (write) markers', async () => {
    const fixture = TestBed.createComponent(SdLegend);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const items = host.querySelectorAll('.legend-item');
    expect(items.length).toBe(6);

    const handshake = host.querySelector(
      '[data-packet-kind="handshake"] .marker',
    );
    expect(handshake?.classList.contains('shape-ring')).toBe(true);

    const write = host.querySelector('[data-packet-kind="write"] .marker');
    expect(write?.classList.contains('shape-square')).toBe(true);

    const request = host.querySelector('[data-packet-kind="request"] .marker');
    expect(request?.classList.contains('shape-dot')).toBe(true);
  });

  it('filters to a custom subset of packet kinds when passed', async () => {
    const fixture = TestBed.createComponent(SdLegend);
    fixture.componentRef.setInput('kinds', ['request', 'response']);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.legend-item').length).toBe(2);
  });
});
