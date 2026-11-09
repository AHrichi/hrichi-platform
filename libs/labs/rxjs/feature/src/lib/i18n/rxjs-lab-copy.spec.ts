import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PreferencesStore, SiteLanguage } from '@ah/shared/state';
import { getRxjsLabCopy, RXJS_LAB_COPY } from './rxjs-lab-copy';
import { NavigationComponent } from '../navigation/navigation.component';
import { QuizService } from '../shared/services/quiz.service';

describe('RxJS Lab i18n (en, fr, ar, it, de)', () => {
  const languages: readonly SiteLanguage[] = ['en', 'fr', 'ar', 'it', 'de'];

  it('provides complete translations for all 5 SiteLanguage locales', () => {
    for (const lang of languages) {
      const copy = getRxjsLabCopy(lang);
      expect(copy).toBe(RXJS_LAB_COPY[lang]);
      expect(copy.shell.title).toBeTruthy();
      expect(copy.nav.categories.length).toBe(3);
      expect(copy.errorHandling.heading).toBeTruthy();
      expect(copy.combiningStreams.heading).toBeTruthy();
      expect(copy.transformingStreams.heading).toBeTruthy();
      expect(copy.sharingData.heading).toBeTruthy();
      expect(copy.multicasting.heading).toBeTruthy();
      expect(copy.reactiveCaching.heading).toBeTruthy();
      expect(copy.bulkOperations.heading).toBeTruthy();
      expect(copy.signals.heading).toBeTruthy();
      expect(copy.rxjsVsSignals.heading).toBeTruthy();
      expect(copy.quiz.heading).toBeTruthy();
      expect(copy.quiz.questions.length).toBe(17);
    }
  });

  it('reactively updates NavigationComponent categories when PreferencesStore language changes', async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationComponent],
      providers: [provideRouter([]), PreferencesStore],
    }).compileComponents();

    const store = TestBed.inject(PreferencesStore);
    const fixture: ComponentFixture<NavigationComponent> =
      TestBed.createComponent(NavigationComponent);
    fixture.componentRef.setInput('isOpen', true);
    const component = fixture.componentInstance;

    store.setLanguage('en');
    fixture.detectChanges();
    expect(component.categories()[0].title).toBe('Core Mechanics');

    store.setLanguage('fr');
    fixture.detectChanges();
    expect(component.categories()[0].title).toBe('Mécaniques de base');

    store.setLanguage('ar');
    fixture.detectChanges();
    expect(component.categories()[0].title).toBe('الآليات الأساسية');

    store.setLanguage('it');
    fixture.detectChanges();
    expect(component.categories()[0].title).toBe('Meccaniche di base');

    store.setLanguage('de');
    fixture.detectChanges();
    expect(component.categories()[0].title).toBe('Kernmechaniken');
  });

  it('returns localized quiz questions by difficulty for all 5 languages', () => {
    const quizService = new QuizService();
    for (const lang of languages) {
      const beginner = quizService.getQuestionsByDifficulty('Beginner', lang);
      const mid = quizService.getQuestionsByDifficulty('Mid-level', lang);
      const senior = quizService.getQuestionsByDifficulty('Senior', lang);

      expect(beginner.length).toBe(5);
      expect(mid.length).toBe(6);
      expect(senior.length).toBe(6);
    }
  });
});
