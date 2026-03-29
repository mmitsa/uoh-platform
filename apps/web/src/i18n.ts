import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar.json';
import en from './locales/en.json';

const saved = (localStorage.getItem('locale') as 'ar' | 'en' | null) ?? 'ar';

void i18n.use(initReactI18next).init({
  lng: saved,
  fallbackLng: 'ar',
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  interpolation: { escapeValue: false },
});

export function setLocale(locale: 'ar' | 'en') {
  i18n.changeLanguage(locale);
  localStorage.setItem('locale', locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
}

// initialize html attributes
document.documentElement.lang = saved;
document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';

export default i18n;

