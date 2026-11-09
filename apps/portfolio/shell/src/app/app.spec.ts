import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PreferencesStore } from '@ah/shared/state';
import { App } from './app';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
  });

  it('renders the main navigation and a skip link in English by default', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const links = Array.from(element.querySelectorAll('nav a')).map((a) =>
      a.textContent?.trim(),
    );

    expect(links).toEqual([
      'Work',
      'Apps & Labs',
      'Experience',
      'Services',
      'Contact',
    ]);
    // The CV is a header action next to the language and theme switches, so
    // it stays visible on phones while the page links scroll.
    expect(
      element.querySelector('.site-header__actions a')?.textContent?.trim(),
    ).toBe('CV');
    expect(element.querySelector('.ah-skip-link')?.getAttribute('href')).toBe(
      '#main',
    );
  });

  it('translates main navigation to Italian and German reactively', async () => {
    const preferences = TestBed.inject(PreferencesStore);
    const fixture = TestBed.createComponent(App);

    preferences.setLanguage('it');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    let links = Array.from(element.querySelectorAll('nav a')).map((a) =>
      a.textContent?.trim(),
    );
    expect(links).toEqual([
      'Progetti',
      'App e Laboratori',
      'Esperienza',
      'Servizi',
      'Contatti',
    ]);

    preferences.setLanguage('de');
    await fixture.whenStable();
    links = Array.from(element.querySelectorAll('nav a')).map((a) =>
      a.textContent?.trim(),
    );
    expect(links).toEqual([
      'Projekte',
      'Apps & Labs',
      'Erfahrung',
      'Leistungen',
      'Kontakt',
    ]);
    expect(
      element.querySelector('.site-header__actions a')?.textContent?.trim(),
    ).toBe('Lebenslauf');
  });
});
