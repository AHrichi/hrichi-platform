import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PreferencesStore } from '@ah/shared/state';
import { ExperiencePage } from './experience-page';

describe('ExperiencePage', () => {
  it('lists every role, newest first, with readable periods', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(ExperiencePage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const titles = Array.from(element.querySelectorAll('.role__title')).map(
      (h) => h.textContent?.trim(),
    );
    const periods = Array.from(
      element.querySelectorAll('.role .ah-eyebrow'),
    ).map((p) => p.textContent?.trim());

    expect(titles[0]).toContain('SeekMake');
    expect(titles).toHaveLength(3);
    expect(periods).toEqual([
      'Oct 2023 – present',
      'May 2023 – Oct 2023',
      'Sep 2021 – May 2023',
    ]);
  });

  it('updates headings and roles when language changes', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(ExperiencePage);
    const prefs = TestBed.inject(PreferencesStore);

    prefs.setLanguage('fr');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe(
      'Mon parcours professionnel',
    );
    expect(
      fixture.nativeElement.querySelector('#skills-heading')?.textContent,
    ).toBe('Compétences clés');

    prefs.setLanguage('ar');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe(
      'محطات مسيرتي المهنية',
    );

    prefs.setLanguage('it');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe(
      'Dove ho lavorato',
    );

    prefs.setLanguage('de');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe(
      'Bisherige Stationen',
    );
  });
});
