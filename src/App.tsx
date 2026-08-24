import { useTranslation } from "react-i18next";
import { Field } from "./components/field";
import type { Frame } from "./domain/models";
import { getFieldPreset } from "./domain/presets/field";
import { fiveVFiveVerticalStackPreset } from "./domain/presets/roster";

// Démo de la Phase 2 (docs/ROADMAP.md) : rendu statique d'un preset 5v5 stack
// vertical sur demi-terrain, pour valider la chaîne de rendu avant l'éditeur.
const demoFieldConfig = getFieldPreset("half");
const demoRoster = fiveVFiveVerticalStackPreset();
const demoFrame: Frame = {
  id: "demo",
  order: 0,
  entities: demoRoster.entities,
  disc: demoRoster.disc,
};

function App() {
  const { t } = useTranslation();

  return (
    <main className="app-shell">
      <h1>{t("app.title")}</h1>
      <p>{t("app.tagline")}</p>
      <p className="placeholder">{t("home.placeholder")}</p>
      <div className="field-demo">
        <Field fieldConfig={demoFieldConfig} frame={demoFrame} />
      </div>
    </main>
  );
}

export default App;
