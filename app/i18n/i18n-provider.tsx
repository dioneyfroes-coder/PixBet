import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  defaultLocale,
  LOCALE_STORAGE_KEY,
  supportedLocales,
  localeMessages,
  type LocaleCode,
  type TranslationMessages,
} from './config';

type I18nContextValue = {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  t: (key: string) => string;
  messages: TranslationMessages;
  availableLocales: typeof supportedLocales;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: LocaleCode;
}) {
  const [locale, setLocaleState] = useState<LocaleCode>(() => initialLocale ?? defaultLocale);

  const setLocale = useCallback((nextLocale: LocaleCode) => {
    setLocaleState(nextLocale);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const resolved = resolveClientLocale();
    setLocaleState((current) => (current === resolved ? current : resolved));
  }, [initialLocale]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const messages = localeMessages[locale];
    return {
      locale,
      setLocale,
      messages,
      availableLocales: supportedLocales,
      t: (key: string) => lookup(messages, key) ?? key,
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export const useTranslation = useI18n;

function isSupportedLocale(value: string): value is LocaleCode {
  return supportedLocales.some((entry) => entry.code === value);
}

function resolveClientLocale(): LocaleCode {
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && isSupportedLocale(stored)) {
    return stored;
  }

  const browserLanguage = window.navigator.language;
  if (browserLanguage && isSupportedLocale(browserLanguage)) {
    return browserLanguage;
  }

  const base = browserLanguage?.split('-')[0];
  if (base) {
    const fallback = supportedLocales.find((entry) => entry.code.startsWith(base));
    if (fallback) {
      return fallback.code;
    }
  }

  return defaultLocale;
}

function lookup(messages: Record<string, unknown>, path: string): string | undefined {
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, messages) as string | undefined;
}
