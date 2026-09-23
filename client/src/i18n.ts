import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslation from "../locales/en/translation.json";
import fiTranslation from "../locales/fi/translation.json";

const resources = {
  en: {
    translation: enTranslation,
  },
  fi: {
    translation: fiTranslation,
  },
};

const language = localStorage.getItem("language") ?? "en";

// React escapes what it renders, so i18next escaping as well turns an
// apostrophe in "Hell's Kitchen" into a visible &#39;.
i18n.use(initReactI18next).init({
  interpolation: { escapeValue: false },
  resources,
  lng: language,
});
