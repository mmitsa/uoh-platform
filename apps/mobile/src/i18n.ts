import { I18nManager } from 'react-native';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ar from './locales/ar.json';
import en from './locales/en.json';

const LANG_KEY = 'uoh_language';

async function loadSavedLang(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(LANG_KEY);
    return saved ?? 'ar';
  } catch {
    return 'ar';
  }
}

void loadSavedLang().then(lng => {
  (globalThis as any).__uohLocale = lng;
  void i18n.use(initReactI18next).init({
    lng,
    fallbackLng: 'ar',
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    interpolation: { escapeValue: false },
  });
});

export async function setLocale(locale: 'ar' | 'en') {
  (globalThis as any).__uohLocale = locale;
  const shouldRtl = locale === 'ar';
  if (I18nManager.isRTL !== shouldRtl) {
    I18nManager.allowRTL(shouldRtl);
    I18nManager.forceRTL(shouldRtl);
  }
  await AsyncStorage.setItem(LANG_KEY, locale);
  await i18n.changeLanguage(locale);
}

export default i18n;
