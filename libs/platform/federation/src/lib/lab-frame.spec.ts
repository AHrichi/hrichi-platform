import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LabFrame } from './lab-frame';

describe('LabFrame', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [LabFrame],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
  });

  it('renders heading, eyebrow, lead and fullscreen toggle button', async () => {
    const fixture = TestBed.createComponent(LabFrame);
    fixture.componentRef.setInput('eyebrow', 'Testing');
    fixture.componentRef.setInput('heading', 'RxJS Lab');
    fixture.componentRef.setInput('lead', 'Interactive exercises');
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Testing');
    expect(element.textContent).toContain('RxJS Lab');
    expect(element.textContent).toContain('Interactive exercises');

    const btn = element.querySelector<HTMLButtonElement>(
      '.lab__fullscreen-btn',
    );
    expect(btn).not.toBeNull();
    expect(btn?.textContent).toContain('Fullscreen Remote');
  });

  it('toggles fullscreen on lab body when fullscreen button is clicked', async () => {
    const fixture = TestBed.createComponent(LabFrame);
    fixture.componentRef.setInput('eyebrow', 'Testing');
    fixture.componentRef.setInput('heading', 'RxJS Lab');
    fixture.componentRef.setInput('lead', 'Interactive exercises');
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const btn = element.querySelector<HTMLButtonElement>(
      '.lab__fullscreen-btn',
    );
    const body = element.querySelector<HTMLElement>('.lab__body');

    expect(body?.classList.contains('is-fullscreen')).toBe(false);

    btn?.click();
    await fixture.whenStable();

    expect(body?.classList.contains('is-fullscreen')).toBe(true);
    expect(btn?.textContent).toContain('Exit Fullscreen');

    // Click exit button
    const exitBtn = element.querySelector<HTMLButtonElement>(
      '.lab__fullscreen-exit',
    );
    expect(exitBtn).not.toBeNull();
    exitBtn?.click();
    await fixture.whenStable();

    expect(body?.classList.contains('is-fullscreen')).toBe(false);
    expect(btn?.textContent).toContain('Fullscreen Remote');
  });
});
