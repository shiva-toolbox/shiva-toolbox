export const LOCALES = ['en-US', 'pt-BR'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en-US';

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function localeFromDiscord(value: string): Locale {
  return value.toLowerCase().startsWith('pt') ? 'pt-BR' : DEFAULT_LOCALE;
}
