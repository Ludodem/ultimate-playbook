import { useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { validateAction } from "../../domain/action";
import type { FieldType } from "../../domain/models";
import {
  DEFAULT_FIELD_TYPE,
  DEFAULT_SIDELINE_MARGIN_METERS,
  getFieldPreset,
} from "../../domain/presets/field";
import {
  emptyPreset,
  fiveVFiveHorizontalStackPreset,
  fiveVFiveVerticalStackPreset,
  type RosterPreset,
} from "../../domain/presets/roster";
import { useActionEditorStore } from "../../state/actionEditorStore";
import { saveActionToLibrary, setLastActiveActionId } from "../../state/libraryStore";

type RosterPresetKey = "empty" | "vertical" | "horizontal";

const ROSTER_BUILDERS: Record<RosterPresetKey, () => RosterPreset> = {
  empty: emptyPreset,
  vertical: fiveVFiveVerticalStackPreset,
  horizontal: fiveVFiveHorizontalStackPreset,
};

const FIELD_TYPES: FieldType[] = ["half", "full", "undefined"];
const FIELD_TYPE_LABEL_KEYS: Record<FieldType, string> = {
  half: "editor.setup.fieldTypeHalf",
  full: "editor.setup.fieldTypeFull",
  undefined: "editor.setup.fieldTypeUndefined",
};

const ROSTER_KEYS: RosterPresetKey[] = ["vertical", "horizontal", "empty"];
const ROSTER_LABEL_KEYS: Record<RosterPresetKey, string> = {
  empty: "editor.setup.rosterEmpty",
  vertical: "editor.setup.rosterVertical",
  horizontal: "editor.setup.rosterHorizontal",
};

/** Écran de démarrage d'une nouvelle action : choix des presets terrain/effectif (Phase 3). */
export function NewActionSetup() {
  const { t } = useTranslation();
  const start = useActionEditorStore((s) => s.start);
  const loadAction = useActionEditorStore((s) => s.loadAction);
  const [actionName, setActionName] = useState(t("editor.setup.defaultName"));
  const [fieldType, setFieldType] = useState<FieldType>(DEFAULT_FIELD_TYPE);
  const [sidelineMargin, setSidelineMargin] = useState(false);
  const [roster, setRoster] = useState<RosterPresetKey>("vertical");
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStart = () => {
    const fieldConfig = getFieldPreset(fieldType);
    if (sidelineMargin) {
      fieldConfig.sidelineMarginMeters = DEFAULT_SIDELINE_MARGIN_METERS;
    }
    start(
      fieldConfig,
      ROSTER_BUILDERS[roster](),
      actionName.trim() || t("editor.setup.defaultName"),
    );
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const result = validateAction(parsed);
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      saveActionToLibrary(result.action);
      setLastActiveActionId(result.action.id);
      loadAction(result.action);
    } catch {
      setImportError(t("editor.setup.importParseError"));
    }
  };

  return (
    <div className="setup-panel">
      <h2>{t("editor.setup.title")}</h2>

      <label className="text-field">
        {t("editor.setup.name")}
        <input type="text" value={actionName} onChange={(e) => setActionName(e.target.value)} />
      </label>

      <fieldset>
        <legend>{t("editor.setup.fieldType")}</legend>
        {FIELD_TYPES.map((type) => (
          <label key={type} className="radio-option">
            <input
              type="radio"
              name="fieldType"
              checked={fieldType === type}
              onChange={() => setFieldType(type)}
            />
            {t(FIELD_TYPE_LABEL_KEYS[type])}
          </label>
        ))}
      </fieldset>

      <label className="checkbox-option">
        <input
          type="checkbox"
          checked={sidelineMargin}
          onChange={(e) => setSidelineMargin(e.target.checked)}
        />
        {t("editor.setup.sidelineMargin")}
      </label>

      <fieldset>
        <legend>{t("editor.setup.roster")}</legend>
        {ROSTER_KEYS.map((key) => (
          <label key={key} className="radio-option">
            <input
              type="radio"
              name="roster"
              checked={roster === key}
              onChange={() => setRoster(key)}
            />
            {t(ROSTER_LABEL_KEYS[key])}
          </label>
        ))}
      </fieldset>

      <button type="button" className="primary" onClick={handleStart}>
        {t("editor.setup.start")}
      </button>

      <div className="import-panel">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="import-input-hidden"
          onChange={(e) => void handleFileSelected(e)}
        />
        <button type="button" onClick={handleImportClick}>
          {t("editor.setup.import")}
        </button>
        {importError && <p className="warning">{importError}</p>}
      </div>
    </div>
  );
}
