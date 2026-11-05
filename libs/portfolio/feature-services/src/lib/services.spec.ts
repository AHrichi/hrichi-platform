import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PreferencesStore } from '@ah/shared/state';
import { ContactPage } from './contact-page';
import { SiteConfigService } from '@ah/shared/site-config';
import { ServicesPage } from './services-page';

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideRouter([])],
  });
});

describe('ServicesPage', () => {
  it('backs each service with links to real case studies', async () => {
    const fixture = TestBed.createComponent(ServicesPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const proofLinks = Array.from(element.querySelectorAll('.proof a')).map(
      (a) => a.getAttribute('href'),
    );

    expect(element.querySelectorAll('.service-title').length).toBeGreaterThan(
      4,
    );
    expect(proofLinks.length).toBeGreaterThan(0);
    for (const href of proofLinks) {
      expect(href).toMatch(/^\/work\/[a-z0-9-]+$/);
    }
  });

  it('updates headings and services when language changes', async () => {
    const fixture = TestBed.createComponent(ServicesPage);
    const prefs = TestBed.inject(PreferencesStore);

    prefs.setLanguage('fr');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe(
      'Services',
    );
    expect(
      fixture.nativeElement.querySelector('#process-heading')?.textContent,
    ).toBe('Méthodologie de travail');

    prefs.setLanguage('ar');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe(
      'الخدمات الهندسية',
    );

    prefs.setLanguage('it');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe(
      'Servizi',
    );

    prefs.setLanguage('de');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe(
      'Leistungen',
    );
  });
});

describe('ContactPage', () => {
  it('lists direct ways to reach me beside the form', async () => {
    TestBed.overrideProvider(SiteConfigService, {
      useValue: {
        load: async () => ({
          apiUrl: null,
          turnstileSiteKey: null,
          orbitApiUrl: null,
        }),
      },
    });
    const fixture = TestBed.createComponent(ContactPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const aside = element.querySelector('aside');

    expect(element.querySelector('ah-contact-form')).not.toBeNull();
    expect(
      aside?.querySelector('a[href^="mailto:"]')?.getAttribute('href'),
    ).toBe('mailto:ahmed.hrichi.web@gmail.com');
    expect(aside?.textContent).toContain('linkedin.com/in/a-hrichi');
  });

  it('updates contact texts when language changes', async () => {
    TestBed.overrideProvider(SiteConfigService, {
      useValue: {
        load: async () => ({
          apiUrl: null,
          turnstileSiteKey: null,
          orbitApiUrl: null,
        }),
      },
    });
    const fixture = TestBed.createComponent(ContactPage);
    const prefs = TestBed.inject(PreferencesStore);

    prefs.setLanguage('fr');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe(
      'Échangeons ensemble',
    );

    prefs.setLanguage('ar');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe(
      'فلنتحدث معاً',
    );

    prefs.setLanguage('it');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe(
      'Parliamone insieme',
    );

    prefs.setLanguage('de');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe(
      'Lassen Sie uns sprechen',
    );
  });
});
