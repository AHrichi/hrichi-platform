import '@angular/compiler';
import { checkTour } from '@ah/platform/tour';
import { describe, expect, it } from 'vitest';
import { AR } from '../i18n/copy.ar';
import { DE } from '../i18n/copy.de';
import { EN } from '../i18n/copy.en';
import { FR } from '../i18n/copy.fr';
import { IT } from '../i18n/copy.it';
import { SERRA_TOUR, serraTourText } from './serra-tour';

describe('SerraCalc’s tour', () => {
  it('is a valid tour', () => {
    expect(checkTour(SERRA_TOUR)).toEqual([]);
  });

  it('has words for every step in every language, and no extra ones', () => {
    const ids = SERRA_TOUR.steps.map((step) => step.id).sort();
    for (const copy of [EN, FR, AR, IT, DE]) {
      expect(Object.keys(copy.tour.steps).sort()).toEqual(ids);
      for (const id of ids) {
        const text = serraTourText(copy)(id);
        expect(text.title.length).toBeGreaterThan(0);
        expect(text.body.length).toBeGreaterThan(20);
      }
    }
  });

  it('opens a screen before any step whose target lives on one', () => {
    expect(SERRA_TOUR.steps[0]).toMatchObject({ route: { path: 'projects' } });
    const field = SERRA_TOUR.steps.find((step) => step.id === 'field');
    expect(field).toMatchObject({
      route: { path: 'heating', query: { tab: 'peak' } },
    });
  });
});
