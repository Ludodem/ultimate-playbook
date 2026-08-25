import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { NewActionSetup, PositionEditor } from "./components/editor";
import { useActionEditorStore } from "./state/actionEditorStore";
import { getLastActiveActionId, loadActionFromLibrary } from "./state/libraryStore";

function App() {
  const { t } = useTranslation();
  const hasStarted = useActionEditorStore((s) => s.currentFrameId !== null);
  const loadAction = useActionEditorStore((s) => s.loadAction);

  // Reprise automatique de la dernière action active au chargement de la page
  // (Phase 7, docs/ROADMAP.md) : pas de bibliothèque à choisir au MVP, une
  // seule action "active" à la fois.
  useEffect(() => {
    const lastId = getLastActiveActionId();
    if (!lastId) return;
    const action = loadActionFromLibrary(lastId);
    if (action) loadAction(action);
  }, [loadAction]);

  return (
    <main className="app-shell">
      {!hasStarted && (
        <>
          <h1>{t("app.title")}</h1>
          <p>{t("app.tagline")}</p>
        </>
      )}
      {hasStarted ? <PositionEditor /> : <NewActionSetup />}
    </main>
  );
}

export default App;
