import React, { createContext, useContext, useState, useCallback } from 'react';
import { TRANSLATIONS } from '@/i18n/translations';
import { SECTION_TRANSLATIONS } from '@/i18n/sectionTranslations';
import { LOCATION_TRANSLATIONS } from '@/features/location/i18n/locationTranslations';

// System-wide UI language. Persisted locally, defaults to English.
// It only affects interface chrome — never user-generated content.
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('system_lang') || 'en');

  const setLang = useCallback((code) => {
    localStorage.setItem('system_lang', code);
    setLangState(code);
  }, []);

  const t = useCallback((key, vars) => {
    let str = LOCATION_TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS[lang]?.[key] ?? SECTION_TRANSLATIONS[lang]?.[key]
      ?? LOCATION_TRANSLATIONS.en[key] ?? TRANSLATIONS.en[key] ?? SECTION_TRANSLATIONS.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) str = str.replaceAll(`{${k}}`, v);
    return str;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}