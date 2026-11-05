import { DOCUMENT } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PreferencesStore } from '@ah/shared/state';
import { CvPage } from './cv-page';

describe('CvPage', () => {
  it('links the generated PDF and prints on request', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(CvPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const print = vi
      .spyOn(TestBed.inject(DOCUMENT).defaultView as Window, 'print')
      .mockImplementation(() => undefined);

    expect(element.querySelector('h1')?.textContent).toBe('Ahmed Hrichi');
    expect(element.querySelector('a[download]')?.getAttribute('href')).toBe(
      '/ahmed-hrichi-cv.pdf',
    );

    (element.querySelector('button') as HTMLButtonElement).click();
    expect(print).toHaveBeenCalledOnce();
  });

  it('translates headings and buttons on language change', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(CvPage);
    const prefs = TestBed.inject(PreferencesStore);

    prefs.setLanguage('fr');
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('a[download]')?.textContent,
    ).toBe('Télécharger le PDF');
    expect(
      fixture.nativeElement.querySelector('#cv-experience')?.textContent,
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
});
