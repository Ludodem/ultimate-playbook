import { useRef, useState, type ChangeEvent, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { validateAction } from "../../domain/action";
import type { FieldType } from "../../domain/models";
import { DEFAULT_SIDELINE_MARGIN_METERS, getFieldPreset } from "../../domain/presets/field";
import {
  emptyPreset,
  fiveVFiveHorizontalStackPreset,
  fiveVFiveVerticalStackPreset,
  type RosterPreset,
} from "../../domain/presets/roster";
import { useActionEditorStore } from "../../state/actionEditorStore";
import { saveActionToLibrary, setLastActiveActionId } from "../../state/libraryStore";
import {
  EmptyRosterIcon,
  FullFieldIcon,
  HalfFieldIcon,
  HorizontalStackIcon,
  SidelineFieldIcon,
  VerticalStackIcon,
} from "../icons/SetupIcons";
import { SetupTile } from "./SetupTile";

/** Preset de terrain proposé à la création (Phase 9, docs/PRD.md §4.9) : 3
 * choix mutuellement exclusifs plutôt qu'un type de terrain + une case
 * "marge sideline" orthogonale — "longue ligne" est un demi-terrain avec
 * marge, pas une combinaison libre. "Terrain indéfini" retiré de cet écran. */
type FieldPresetKey = "half" | "full" | "sideline";

const FIELD_PRESET_KEYS: FieldPresetKey[] = ["half", "full", "sideline"];
const FIELD_PRESET_ICONS: Record<FieldPresetKey, ComponentType> = {
  half: HalfFieldIcon,
  full: FullFieldIcon,
  sideline: SidelineFieldIcon,
};
const FIELD_PRESET_LABEL_KEYS: Record<FieldPresetKey, string> = {
  half: "editor.setup.fieldTypeHalf",
  full: "editor.setup.fieldTypeFull",
  sideline: "editor.setup.fieldTypeSideline",
};

type RosterPresetKey = "empty" | "vertical" | "horizontal";

const ROSTER_BUILDERS: Record<RosterPresetKey, () => RosterPreset> = {
  empty: emptyPreset,
  vertical: fiveVFiveVerticalStackPreset,
  horizontal: fiveVFiveHorizontalStackPreset,
};

const ROSTER_KEYS: RosterPresetKey[] = ["vertical", "horizontal", "empty"];
const ROSTER_ICONS: Record<RosterPresetKey, ComponentType> = {
  empty: EmptyRosterIcon,
  vertical: VerticalStackIcon,
  horizontal: HorizontalStackIcon,
};
const ROSTER_LABEL_KEYS: Record<RosterPresetKey, string> = {
  empty: "editor.setup.rosterEmpty",
  vertical: "editor.setup.rosterVertical",
  horizontal: "editor.setup.rosterHorizontal",
};

/** Écran de démarrage d'une nouvelle action : choix des presets terrain/effectif (Phase 3, retravaillé en tuiles Phase 9). */
export function NewActionSetup() {
  const { t } = useTranslation();
  const start = useActionEditorStore((s) => s.start);
  const loadAction = useActionEditorStore((s) => s.loadAction);
  const [actionName, setActionName] = useState(t("editor.setup.defaultName"));
  const [fieldPreset, setFieldPreset] = useState<FieldPresetKey>("half");
  const [roster, setRoster] = useState<RosterPresetKey>("vertical");
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStart = () => {
    const type: FieldType = fieldPreset === "full" ? "full" : "half";
    const fieldConfig = getFieldPreset(type);
    if (fieldPreset === "sideline") {
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

      <span className="menu-section-label">{t("editor.setup.fieldType")}</span>
      <div className="setup-tiles">
        {FIELD_PRESET_KEYS.map((key) => {
          const Icon = FIELD_PRESET_ICONS[key];
          return (
            <SetupTile
              key={key}
              icon={<Icon />}
              label={t(FIELD_PRESET_LABEL_KEYS[key])}
              selected={fieldPreset === key}
              onClick={() => setFieldPreset(key)}
            />
          );
        })}
      </div>

      <span className="menu-section-label">{t("editor.setup.roster")}</span>
      <div className="setup-tiles">
        {ROSTER_KEYS.map((key) => {
          const Icon = ROSTER_ICONS[key];
          return (
            <SetupTile
              key={key}
              icon={<Icon />}
              label={t(ROSTER_LABEL_KEYS[key])}
              selected={roster === key}
              onClick={() => setRoster(key)}
            />
          );
        })}
      </div>

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
