import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AppsPage } from './apps-page';

describe('AppsPage', () => {
  it('renders production applications and engineering labs', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(AppsPage);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('PulseOps');
    expect(text).toContain('StrategyApp');
    expect(text).toContain('StudyLM');
    expect(text).toContain('Sky Lab');
    expect(text).toContain('RxJS Interactive Lab');
    expect(text).toContain('NgRx State Architecture Lab');
  });
});
