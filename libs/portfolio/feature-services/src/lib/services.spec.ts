import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ContactPage } from './contact-page';
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
  it('offers email links with an encoded subject for each intent', async () => {
    const fixture = TestBed.createComponent(ContactPage);
    await fixture.whenStable();
    const mailtos = Array.from<HTMLAnchorElement>(
      fixture.nativeElement.querySelectorAll('a[href^="mailto:"]'),
    ).map((a) => a.getAttribute('href'));

    expect(mailtos).toContain(
      'mailto:ahmed.hrichi.web@gmail.com?subject=Opportunity%20for%20Ahmed%20Hrichi',
    );
    expect(mailtos).toContain(
      'mailto:ahmed.hrichi.web@gmail.com?subject=Project%20enquiry',
    );
  });
});
