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

  it('starts with all tickets expanded by default', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(AppsPage);
    await fixture.whenStable();

    const cards: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.app-card'),
    );
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.classList.contains('app-card--collapsed')).toBe(false);
    }

    const toggleBtns = fixture.nativeElement.querySelectorAll(
      '.app-card__toggle-btn',
    );
    expect(toggleBtns[0].getAttribute('aria-expanded')).toBe('true');
  });

  it('collapses and expands an individual ticket when toggle button is clicked', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(AppsPage);
    await fixture.whenStable();

    const firstCard = fixture.nativeElement.querySelector('.app-card');
    const firstToggleBtn = firstCard.querySelector('.app-card__toggle-btn');
    const firstBody = firstCard.querySelector('.app-card__body');

    expect(firstCard.classList.contains('app-card--collapsed')).toBe(false);
    expect(firstBody.hidden).toBe(false);

    // Click to collapse
    firstToggleBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(firstCard.classList.contains('app-card--collapsed')).toBe(true);
    expect(firstBody.hidden).toBe(true);
    expect(firstToggleBtn.getAttribute('aria-expanded')).toBe('false');

    // Quick launch button should now be visible in the header
    const quickLaunch = firstCard.querySelector('.app-quick-launch-btn');
    expect(quickLaunch).toBeTruthy();

    // Click to expand again
    firstToggleBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(firstCard.classList.contains('app-card--collapsed')).toBe(false);
    expect(firstBody.hidden).toBe(false);
    expect(firstToggleBtn.getAttribute('aria-expanded')).toBe('true');
    expect(firstCard.querySelector('.app-quick-launch-btn')).toBeFalsy();
  });

  it('toggles ticket collapse state when header is clicked', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(AppsPage);
    await fixture.whenStable();

    const firstCard = fixture.nativeElement.querySelector('.app-card');
    const header = firstCard.querySelector('.app-card__header');
    const title = firstCard.querySelector('.app-title');

    expect(firstCard.classList.contains('app-card--collapsed')).toBe(false);

    // Click on title inside header
    title.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(firstCard.classList.contains('app-card--collapsed')).toBe(true);

    // Click header again to expand
    header.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(firstCard.classList.contains('app-card--collapsed')).toBe(false);
  });

  it('collapses and expands all tickets using the toolbar toggle-all button', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(AppsPage);
    await fixture.whenStable();

    const toggleAllBtn = fixture.nativeElement.querySelector(
      '.apps-toggle-all-btn',
    );
    expect(toggleAllBtn).toBeTruthy();
    expect(toggleAllBtn.getAttribute('aria-expanded')).toBe('true');

    // Click Collapse All
    toggleAllBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const cards: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.app-card'),
    );
    for (const card of cards) {
      expect(card.classList.contains('app-card--collapsed')).toBe(true);
    }
    expect(toggleAllBtn.getAttribute('aria-expanded')).toBe('false');

    // Click Expand All
    toggleAllBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    for (const card of cards) {
      expect(card.classList.contains('app-card--collapsed')).toBe(false);
    }
    expect(toggleAllBtn.getAttribute('aria-expanded')).toBe('true');
  });
});
