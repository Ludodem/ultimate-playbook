import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const [fieldType, setFieldType] = useState<FieldType>(DEFAULT_FIELD_TYPE);
  const [sidelineMargin, setSidelineMargin] = useState(false);
  const [roster, setRoster] = useState<RosterPresetKey>("vertical");

  const handleStart = () => {
    const fieldConfig = getFieldPreset(fieldType);
    if (sidelineMargin) {
      fieldConfig.sidelineMarginMeters = DEFAULT_SIDELINE_MARGIN_METERS;
    }
    start(fieldConfig, ROSTER_BUILDERS[roster]());
  };

  return (
    <div className="setup-panel">
      <h2>{t("editor.setup.title")}</h2>

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

      <button type="button" onClick={handleStart}>
        {t("editor.setup.start")}
      </button>
    </div>
  );
}
