import { DOCUMENT } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { PreferencesStore } from '@ah/shared/state';
import { CvPage, type CvVariant } from './cv-page';

function render(variant?: CvVariant) {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideRouter([])],
  });
  const fixture = TestBed.createComponent(CvPage);
  if (variant) fixture.componentRef.setInput('variant', variant);
  return fixture;
}

const headings = (element: HTMLElement) =>
  Array.from(element.querySelectorAll('h2')).map((h) => h.textContent?.trim());

describe('CvPage', () => {
  it('links the generated PDF and prints on request', async () => {
    const fixture = render();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const print = vi
      .spyOn(TestBed.inject(DOCUMENT).defaultView as Window, 'print')
      .mockImplementation(() => undefined);

    expect(element.querySelector('h1')?.textContent).toBe('Ahmed Hrichi');
    expect(element.querySelector('a[download]')?.getAttribute('href')).toBe(
      '/ahmed-hrichi-cv.pdf',
    );
    expect(element.querySelector('.other-cv')?.getAttribute('href')).toBe(
      '/cv/energy',
    );
    expect(element.querySelector('#cv-projects')).toBeNull();
    expect(TestBed.inject(Title).getTitle()).toBe('CV · Ahmed Hrichi');

    (element.querySelector('button') as HTMLButtonElement).click();
    expect(print).toHaveBeenCalledOnce();
  });

  it('translates headings and buttons on language change', async () => {
    const fixture = render();
    const prefs = TestBed.inject(PreferencesStore);

    prefs.setLanguage('fr');
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('a[download]')?.textContent,
    ).toBe('Télécharger le PDF');
    expect(
      fixture.nativeElement.querySelector('#cv-experience')?.textContent.trim(),
    ).toBe('Expérience professionnelle');

    prefs.setLanguage('ar');
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('a[download]')?.textContent,
    ).toBe('تحميل ملف PDF');

    prefs.setLanguage('it');
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('a[download]')?.textContent,
    ).toBe('Scarica PDF');

    prefs.setLanguage('de');
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('a[download]')?.textContent,
    ).toBe('PDF herunterladen');
  });

  describe('energy variant', () => {
    it('leads with the degree, then energy skills and projects', async () => {
      const fixture = render('energy');
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;

      expect(element.querySelector('.cv__role')?.textContent).toBe(
        'Energy Engineer · Thermal, Solar & Engineering Software',
      );
      expect(headings(element)).toEqual([
        'Summary',
        'Education',
        'Languages',
        'Skills',
        'Engineering projects',
        'Software engineering experience',
      ]);
      expect(
        element.querySelector('#cv-education + ul')?.textContent,
      ).toContain('National Engineering Degree in Energy Engineering');
      expect(
        Array.from(element.querySelectorAll('.cv__skills dt')).map(
          (dt) => dt.textContent,
        ),
      ).toContain('Thermal & HVAC');

      const projects = Array.from(
        element.querySelectorAll('[aria-labelledby="cv-projects"] h3'),
      ).map((h) => h.textContent?.trim());
      expect(projects).toEqual([
        'SerraCalc · Greenhouse heating, cooling and water engineering',
        'LuxPath · Public and solar street lighting engineering',
      ]);
      expect(
        element
          .querySelector('[aria-labelledby="cv-projects"] a')
          ?.getAttribute('href'),
      ).toBe('https://portfolio.ahmed-hrichi.workers.dev/apps/serracalc');
    });

    it('keeps the software roles short and links its own PDF', async () => {
      const fixture = render('energy');
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;
      const experience = element.querySelector(
        '[aria-labelledby="cv-experience"]',
      ) as HTMLElement;

      expect(experience.querySelectorAll('h3')).toHaveLength(3);
      expect(experience.querySelector('.cv__bullets')).toBeNull();
      expect(element.querySelector('a[download]')?.getAttribute('href')).toBe(
        '/ahmed-hrichi-energy-cv.pdf',
      );
      expect(element.querySelector('.other-cv')?.getAttribute('href')).toBe(
        '/cv',
      );
      expect(TestBed.inject(Title).getTitle()).toBe(
        'Energy engineering CV · Ahmed Hrichi',
      );
    });

    it('follows the site language', async () => {
      const fixture = render('energy');
      const prefs = TestBed.inject(PreferencesStore);

      prefs.setLanguage('fr');
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('#cv-projects')?.textContent).toBe(
        'Projets d’ingénierie',
      );
      expect(element.querySelector('.cv__role')?.textContent).toBe(
        'Ingénieur énergéticien · Thermique, solaire et logiciels d’ingénierie',
      );
      expect(element.querySelector('.other-cv')?.textContent).toBe(
        'CV développeur logiciel',
      );
    });
  });
});
