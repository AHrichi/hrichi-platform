import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
});
