import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./fr.json";

// Français par défaut et unique langue traduite au MVP (voir docs/PRD.md §4.7).
// La structure i18n est en place dès le départ pour ajouter d'autres langues
// plus tard sans refactoring : il suffira d'ajouter une ressource ici.
void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
  },
  lng: "fr",
  fallbackLng: "fr",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
