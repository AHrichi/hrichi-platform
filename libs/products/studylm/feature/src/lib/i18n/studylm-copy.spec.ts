import { describe, expect, it } from 'vitest';
import { STUDYLM_COPY } from './studylm-copy';

describe('STUDYLM_COPY i18n dictionary', () => {
  const languages = ['en', 'fr', 'ar', 'it', 'de'] as const;
  const sections = [
    'metrics',
    'screens',
    'shell',
    'roadmap',
    'learn',
    'flashcards',
    'quiz',
    'sources',
    'stats',
    'modals',
  ] as const;

  it('defines non-empty translations for all 5 languages across all sections', () => {
    const enKeys = Object.keys(STUDYLM_COPY.en).sort();

    for (const lang of languages) {
      const copy = STUDYLM_COPY[lang];
      expect(copy).toBeDefined();
      expect(Object.keys(copy).sort()).toEqual(enKeys);

      for (const section of sections) {
        const enSectionKeys = Object.keys(STUDYLM_COPY.en[section]).sort();
        const langSection = copy[section];
        expect(Object.keys(langSection).sort()).toEqual(enSectionKeys);

        for (const [key, value] of Object.entries(langSection)) {
          expect(
            typeof value === 'string' && value.trim().length > 0,
            `${lang}.${section}.${key} should be a non-empty string`,
          ).toBe(true);
        }
      }
    }
  });
});
