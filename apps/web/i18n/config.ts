/**
 * i18n Configuration
 * Supported locales and default language settings
 */

export const locales = ['en', 'de', 'es', 'fr', 'it', 'pt', 'ja', 'zh'] as const
export type Locale = typeof locales[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  pt: 'Português',
  ja: '日本語',
  zh: '中文'
}

