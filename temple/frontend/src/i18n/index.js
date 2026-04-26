import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./en.json";
import ta from "./ta.json";

export const SUPPORTED = ["en", "ta"];
export const STORAGE_KEY = "aalayam.lang";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ta: { translation: ta },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED,
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    interpolation: { escapeValue: false },
    returnNull: false,
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: STORAGE_KEY,
    },
  });

function applyLang(lng) {
  const code = SUPPORTED.includes(lng) ? lng : "en";
  document.documentElement.setAttribute("lang", code);
  document.documentElement.setAttribute("data-lang", code);
}

i18n.on("languageChanged", applyLang);
applyLang(i18n.language);

export default i18n;
