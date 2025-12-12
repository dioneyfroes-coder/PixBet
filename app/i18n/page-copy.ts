import { defaultLocale, localeMessages, type LocaleCode } from './config';

export const pageSections = [
  'home',
  'gamesHub',
  'audit',
  'wallet',
  'contact',
  'login',
  'register',
  'store',
  'profile',
  'activity',
  'about',
] as const;

export type PageSectionKey = (typeof pageSections)[number];

export function getPageCopy(section: PageSectionKey, locale: LocaleCode = defaultLocale) {
  return localeMessages[locale][section];
}

export function getPageMeta(section: PageSectionKey, locale: LocaleCode = defaultLocale) {
  const sectionCopy = getPageCopy(section, locale);
  const typedCopy = sectionCopy as {
    meta?: { title?: string; description?: string };
    title?: string;
    description?: string;
  };

  return {
    title: typedCopy.meta?.title ?? String(typedCopy.title ?? ''),
    description: typedCopy.meta?.description ?? String(typedCopy.description ?? ''),
  };
}
