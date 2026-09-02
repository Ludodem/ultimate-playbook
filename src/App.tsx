import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { NewActionSetup, PositionEditor } from "./components/editor";
import { LibraryView } from "./components/library";
import { useActionEditorStore } from "./state/actionEditorStore";
import { useNavigationStore } from "./state/navigationStore";

function App() {
  const { t } = useTranslation();
  const hasStarted = useActionEditorStore((s) => s.currentFrameId !== null);
  const screen = useNavigationStore((s) => s.screen);
  const setScreen = useNavigationStore((s) => s.setScreen);

  // La Bibliothèque est l'écran d'accueil (docs/PRD.md §4.10) : plus de
  // reprise automatique de la dernière action éditée (docs/ARCHITECTURE.md
  // §8). L'écran "editor" suit toujours l'état réel de l'action en cours,
  // dans les deux sens : ouvrir/démarrer une action bascule vers l'éditeur,
  // "Nouvelle action" depuis l'éditeur ramène à la Bibliothèque.
  useEffect(() => {
    if (hasStarted && screen !== "editor") setScreen("editor");
    if (!hasStarted && screen === "editor") setScreen("library");
  }, [hasStarted, screen, setScreen]);

  return (
    <main className="app-shell">
      {screen !== "editor" && (
        <>
          <h1>{t("app.title")}</h1>
          <p>{t("app.tagline")}</p>
        </>
      )}
      {screen === "library" && <LibraryView onCreateNew={() => setScreen("setup")} />}
      {screen === "setup" && <NewActionSetup onBack={() => setScreen("library")} />}
      {screen === "editor" && <PositionEditor />}
    </main>
  );
}

export default App;
