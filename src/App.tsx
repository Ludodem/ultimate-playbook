import { useTranslation } from "react-i18next";

function App() {
  const { t } = useTranslation();

  return (
    <main className="app-shell">
      <h1>{t("app.title")}</h1>
      <p>{t("app.tagline")}</p>
      <p className="placeholder">{t("home.placeholder")}</p>
    </main>
  );
}

export default App;
