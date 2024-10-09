import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import JSON files using ES module imports
// import english from './locales/english.json';
import tamil from './locales/tamil.json';
import malay from './locales/malay.json';
import chinese from './locales/chinese.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      // english: { translation: english },
      tamil: { translation: tamil },
      malay: { translation: malay },
      chinese: { translation: chinese }
    },
    fallbackLng: 'english',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
