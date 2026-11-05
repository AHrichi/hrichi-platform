export * from './i18n.types';
export * from './en';
export * from './fr';
export * from './ar';
export * from './it';
export * from './de';

import { enDictionary } from './en';
import { frDictionary } from './fr';
import { arDictionary } from './ar';
import { itDictionary } from './it';
import { deDictionary } from './de';
import type { AlarmEngineDictionary, AlarmLanguage } from './i18n.types';

export const ALARM_DICTIONARIES: Record<AlarmLanguage, AlarmEngineDictionary> =
  {
    en: enDictionary,
    fr: frDictionary,
    ar: arDictionary,
    it: itDictionary,
    de: deDictionary,
  };
