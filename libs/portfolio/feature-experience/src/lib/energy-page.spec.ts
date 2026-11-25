import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PreferencesStore } from '@ah/shared/state';
import { EnergyPage } from './energy-page';

function render() {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideRouter([])],
  });
  return TestBed.createComponent(EnergyPage);
}

describe('EnergyPage', () => {
  it('shows the degree, the energy CV and both engineering projects', async () => {
    const fixture = render();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toBe(
      'An energy engineer who builds the tools',
    );
    expect(element.textContent).toContain(
      'National Engineering Degree in Energy Engineering',
    );
    expect(
      element.querySelector('a[href="/cv/energy"]')?.textContent?.trim(),
    ).toBe('Energy engineering CV');
    expect(element.querySelector('a[download]')?.getAttribute('href')).toBe(
      '/ahmed-hrichi-energy-cv.pdf',
    );

    const projects = Array.from(element.querySelectorAll('.project h3')).map(
      (h) => h.textContent?.trim(),
    );
    expect(projects).toEqual([
      'SerraCalc · Greenhouse heating, cooling and water engineering',
      'LuxPath · Public and solar street lighting engineering',
    ]);
    expect(
      element.querySelector('a[href="/apps/serracalc"]')?.textContent?.trim(),
    ).toBe('Open SerraCalc');
    expect(
      element.querySelector('a[href="/apps/lighting"]')?.textContent?.trim(),
    ).toBe('Open LuxPath');
  });

  it('follows the site language', async () => {
    const fixture = render();
    const prefs = TestBed.inject(PreferencesStore);
    const h1 = () => fixture.nativeElement.querySelector('h1')?.textContent;

    prefs.setLanguage('fr');
    await fixture.whenStable();
    expect(h1()).toBe('Un ingénieur énergéticien qui construit ses outils');
    expect(fixture.nativeElement.textContent).toContain(
      'Diplôme National d’Ingénieur en Génie Énergétique',
    );

    prefs.setLanguage('ar');
    await fixture.whenStable();
    expect(h1()).toBe('مهندس طاقة يبني أدواته بنفسه');

    prefs.setLanguage('it');
    await fixture.whenStable();
    expect(h1()).toBe(
      'Un ingegnere energetico che costruisce i propri strumenti',
    );

    prefs.setLanguage('de');
    await fixture.whenStable();
    expect(h1()).toBe('Ein Energieingenieur, der seine Werkzeuge selbst baut');
  });
});
