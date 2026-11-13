import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PreferencesStore } from '@ah/shared/state';
import { describe, expect, it } from 'vitest';
import { AppsPage, resolveStandaloneAppUrl } from './apps-page';

describe('AppsPage', () => {
  it('renders production applications and engineering labs', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(AppsPage);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('LuxPath (SolarLux)');
    expect(text).toContain('AutoSphere');
    expect(text).toContain('StudyLM');
    expect(text).toContain('Sky Lab');
    expect(text).toContain('RxJS Interactive Lab');
    expect(text).toContain('NgRx State Architecture Lab');
    // Disabled apps should be hidden
    expect(text).not.toContain('PulseOps');
    expect(text).not.toContain('StrategyApp');
  });

  async function setup() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(AppsPage);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    return { fixture, el };
  }

  it('opens every card compact, with its Launch action visible', async () => {
    const { el } = await setup();
    const cards = Array.from(el.querySelectorAll<HTMLElement>('.app-card'));
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.classList.contains('app-card--collapsed')).toBe(true);
      expect(card.querySelector('.app-summary')).toBeTruthy();
      const launch = card.querySelector('.app-launch-btn');
      expect(launch?.getAttribute('href')).toMatch(/^\/(apps|labs)\//);
      expect(
        (card.querySelector('.app-card__body') as HTMLElement).hidden,
      ).toBe(true);
      expect(
        card
          .querySelector('.app-card__toggle-btn')
          ?.getAttribute('aria-expanded'),
      ).toBe('false');
    }
  });

  it('shows and hides one card’s details with its Details button', async () => {
    const { fixture, el } = await setup();
    const card = el.querySelector('.app-card') as HTMLElement;
    const toggle = card.querySelector(
      '.app-card__toggle-btn',
    ) as HTMLButtonElement;
    const body = card.querySelector('.app-card__body') as HTMLElement;
    expect(toggle.getAttribute('aria-controls')).toBe(body.id);

    toggle.click();
    await fixture.whenStable();
    expect(body.hidden).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.textContent).toContain('Hide details');
    // Launch stays where it was: above the details.
    expect(card.querySelector('.app-launch-btn')).toBeTruthy();

    toggle.click();
    await fixture.whenStable();
    expect(body.hidden).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('does not toggle when the title is clicked', async () => {
    const { fixture, el } = await setup();
    const card = el.querySelector('.app-card') as HTMLElement;
    (card.querySelector('.app-title') as HTMLElement).click();
    await fixture.whenStable();
    expect(card.classList.contains('app-card--collapsed')).toBe(true);
  });

  it('shows and hides every card’s details from the toolbar', async () => {
    const { fixture, el } = await setup();
    const toggleAll = el.querySelector(
      '.apps-toggle-all-btn',
    ) as HTMLButtonElement;
    expect(toggleAll.getAttribute('aria-expanded')).toBe('false');

    toggleAll.click();
    await fixture.whenStable();
    const cards = Array.from(el.querySelectorAll<HTMLElement>('.app-card'));
    for (const card of cards) {
      expect(card.classList.contains('app-card--collapsed')).toBe(false);
    }
    expect(toggleAll.getAttribute('aria-expanded')).toBe('true');

    toggleAll.click();
    await fixture.whenStable();
    for (const card of cards) {
      expect(card.classList.contains('app-card--collapsed')).toBe(true);
    }
  });

  it('renders Italian localized content when language is it', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const store = TestBed.inject(PreferencesStore);
    store.setLanguage('it');
    const fixture = TestBed.createComponent(AppsPage);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Applicazioni & Laboratori Interattivi');
    expect(text).toContain(
      'Piattaforma di Ingegneria per Illuminazione Pubblica e Solare',
    );
    expect(text).not.toContain('Pianificatore di Spedizioni e Campeggio');
  });

  it('renders German localized content when language is de', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const store = TestBed.inject(PreferencesStore);
    store.setLanguage('de');
    const fixture = TestBed.createComponent(AppsPage);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Anwendungen & Interaktive Labore');
    expect(text).toContain(
      'Feld-Engineering-Plattform für Straßen- und Solarbeleuchtung',
    );
    expect(text).not.toContain('Camping- & Outdoor-Tourenplaner');
  });

  it('resolves standalone URLs only for federated remotes', () => {
    expect(resolveStandaloneAppUrl('studylm', false)).toBe(
      'https://product-studylm.ahmed-hrichi.workers.dev',
    );
    expect(resolveStandaloneAppUrl('studylm', true)).toBe(
      'http://localhost:4307',
    );
    expect(resolveStandaloneAppUrl('learning', false)).toBe(
      'https://product-learning.ahmed-hrichi.workers.dev',
    );
    expect(resolveStandaloneAppUrl('learning', true)).toBe(
      'http://localhost:4311',
    );
    expect(resolveStandaloneAppUrl('sky', false)).toBe(
      'https://lab-sky.ahmed-hrichi.workers.dev',
    );
    expect(resolveStandaloneAppUrl('autosphere', false)).toBeNull();
  });

  it('renders a standalone link for every federated app card and omits it for shell-only apps', async () => {
    const { el } = await setup();
    const standaloneLinks = Array.from(
      el.querySelectorAll<HTMLAnchorElement>('.app-standalone-btn'),
    );
    const cards = Array.from(el.querySelectorAll<HTMLElement>('.app-card'));
    // Enabled federated apps: lighting, studylm, learning, sky, rxjs, ngrx (autosphere is shell-only).
    expect(standaloneLinks.length).toBe(cards.length - 1);
    for (const link of standaloneLinks) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('href')).toMatch(/^https?:\/\//);
      expect(link.getAttribute('aria-label')).toContain('Open standalone:');
    }
  });
});
