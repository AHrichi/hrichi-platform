export * from './i18n.types';
export * from './en';
export * from './fr';
export * from './ar';

import { enDictionary } from './en';
import { frDictionary } from './fr';
import { arDictionary } from './ar';
import type { AlarmEngineDictionary, AlarmLanguage } from './i18n.types';

export const ALARM_DICTIONARIES: Record<AlarmLanguage, AlarmEngineDictionary> = {
  en: enDictionary,
  fr: frDictionary,
  ar: arDictionary,
};
