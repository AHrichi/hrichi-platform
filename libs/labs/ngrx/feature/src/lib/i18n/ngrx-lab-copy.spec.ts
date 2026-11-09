import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PreferencesStore, type SiteLanguage } from '@ah/shared/state';
import { NGRX_LAB_COPY, getNgrxLabCopy } from './ngrx-lab-copy';
import { NgrxNavigationComponent } from '../navigation/navigation.component';

describe('NGRX_LAB_COPY i18n dictionary', () => {
  const languages: readonly SiteLanguage[] = ['en', 'fr', 'ar', 'it', 'de'];

  it.each(languages)('provides complete copy for %s', (lang) => {
    const bundle = getNgrxLabCopy(lang);
    expect(bundle.navigation.storeFlow).toBeTruthy();
    expect(bundle.navigation.signalStore).toBeTruthy();
    expect(bundle.navigation.effectsCycle).toBeTruthy();
    expect(bundle.navigation.ngrxVsServices).toBeTruthy();
    expect(bundle.storeFlow.heading).toBeTruthy();
    expect(bundle.signalStore.heading).toBeTruthy();
    expect(bundle.effectsCycle.heading).toBeTruthy();
    expect(bundle.ngrxVsServices.heading).toBeTruthy();
    expect(bundle.ngrxVsServices.patterns.length).toBe(4);
    expect(bundle.ngrxVsServices.interview.faqs.length).toBe(4);
  });

  it('updates NgrxNavigationComponent reactively when PreferencesStore language changes', async () => {
    await TestBed.configureTestingModule({
      imports: [NgrxNavigationComponent],
      providers: [provideRouter([]), PreferencesStore],
    }).compileComponents();

    const store = TestBed.inject(PreferencesStore);
    const fixture = TestBed.createComponent(NgrxNavigationComponent);
    fixture.detectChanges();

    store.setLanguage('fr');
    fixture.detectChanges();
    expect(fixture.componentInstance.copy().storeFlow).toBe(
      NGRX_LAB_COPY.fr.navigation.storeFlow,
    );

    store.setLanguage('ar');
    fixture.detectChanges();
    expect(fixture.componentInstance.copy().storeFlow).toBe(
      NGRX_LAB_COPY.ar.navigation.storeFlow,
    );
  });
});
