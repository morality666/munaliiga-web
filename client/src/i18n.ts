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

i18n.use(initReactI18next).init({ resources, lng: "en" });
