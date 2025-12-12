import ptBR from './locales/ptbr.json';
import ptMZ from './locales/ptmz.json';
import es from './locales/es.json';
import en from './locales/en.json';

export const supportedLocales = [
  { code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'pt-MZ', label: 'Português (Moçambique)', flag: '🇲🇿' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
] as const;

export type LocaleCode = (typeof supportedLocales)[number]['code'];

const localeMessagesMap = {
  'pt-BR': ptBR,
  'pt-MZ': ptMZ,
  en,
  es,
} as const;

export type LocaleMessagesMap = typeof localeMessagesMap;
export type TranslationMessages = LocaleMessagesMap[LocaleCode];

export const localeMessages: LocaleMessagesMap = localeMessagesMap;

export const defaultLocale: LocaleCode = 'pt-BR';
export const LOCALE_STORAGE_KEY = 'frontbet:locale';
