import { useTranslation } from "react-i18next";
import { NewActionSetup, PositionEditor } from "./components/editor";
import { useActionEditorStore } from "./state/actionEditorStore";

function App() {
  const { t } = useTranslation();
  const frame = useActionEditorStore((s) => s.frame);

  return (
    <main className="app-shell">
      <h1>{t("app.title")}</h1>
      <p>{t("app.tagline")}</p>
      {frame ? <PositionEditor /> : <NewActionSetup />}
    </main>
  );
}

export default App;
