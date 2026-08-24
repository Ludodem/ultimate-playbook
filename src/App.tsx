import { useTranslation } from "react-i18next";
import { NewActionSetup, PositionEditor } from "./components/editor";
import { useActionEditorStore } from "./state/actionEditorStore";

function App() {
  const { t } = useTranslation();
  const hasStarted = useActionEditorStore((s) => s.currentFrameId !== null);

  return (
    <main className="app-shell">
      <h1>{t("app.title")}</h1>
      <p>{t("app.tagline")}</p>
      {hasStarted ? <PositionEditor /> : <NewActionSetup />}
    </main>
  );
}

export default App;
