import { create } from "zustand";

export type Screen = "library" | "setup" | "editor";

interface NavigationState {
  screen: Screen;
  setScreen: (screen: Screen) => void;
}

/** Écran affiché au niveau racine de l'app (docs/PRD.md §4.10) : navigation
 * pure, jamais persistée — on repart toujours sur la Bibliothèque au
 * rechargement de la page. La transition vers/depuis "editor" est pilotée
 * automatiquement par `App.tsx` (dès qu'une action est chargée/quittée dans
 * `actionEditorStore`), pas par cette valeur directement. */
export const useNavigationStore = create<NavigationState>((set) => ({
  screen: "library",
  setScreen: (screen) => set({ screen }),
}));
