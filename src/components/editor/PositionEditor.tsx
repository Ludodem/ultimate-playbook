import { useTranslation } from "react-i18next";
import { Field } from "../field";
import { MAX_RECOMMENDED_PER_TEAM, useActionEditorStore } from "../../state/actionEditorStore";

/** Éditeur de positions d'une action en cours (Phase 3, docs/ROADMAP.md). */
export function PositionEditor() {
  const { t } = useTranslation();
  const fieldConfig = useActionEditorStore((s) => s.fieldConfig);
  const frame = useActionEditorStore((s) => s.frame);
  const selectedEntityId = useActionEditorStore((s) => s.selectedEntityId);
  const selectEntity = useActionEditorStore((s) => s.selectEntity);
  const moveEntity = useActionEditorStore((s) => s.moveEntity);
  const moveDisc = useActionEditorStore((s) => s.moveDisc);
  const addEntity = useActionEditorStore((s) => s.addEntity);
  const removeEntity = useActionEditorStore((s) => s.removeEntity);
  const assignDiscTo = useActionEditorStore((s) => s.assignDiscTo);
  const freeDisc = useActionEditorStore((s) => s.freeDisc);
  const undo = useActionEditorStore((s) => s.undo);
  const redo = useActionEditorStore((s) => s.redo);
  const past = useActionEditorStore((s) => s.past);
  const future = useActionEditorStore((s) => s.future);

  if (!fieldConfig || !frame) return null;

  const selectedEntity = frame.entities.find((e) => e.id === selectedEntityId) ?? null;
  const offenseCount = frame.entities.filter((e) => e.team === "offense").length;
  const defenseCount = frame.entities.filter((e) => e.team === "defense").length;
  const showRosterWarning =
    offenseCount > MAX_RECOMMENDED_PER_TEAM || defenseCount > MAX_RECOMMENDED_PER_TEAM;

  return (
    <div className="editor">
      <div className="field-demo">
        <Field
          fieldConfig={fieldConfig}
          frame={frame}
          interactive={{
            selectedEntityId,
            onEntitySelect: selectEntity,
            onEntityMove: moveEntity,
            onDiscMove: moveDisc,
            onFieldClick: (x, y) => {
              if (selectedEntityId) moveEntity(selectedEntityId, x, y);
            },
          }}
        />
      </div>

      <p className="hint">{t("editor.toolbar.selectionHint")}</p>

      <div className="toolbar">
        <button type="button" onClick={() => addEntity("offense")}>
          {t("editor.toolbar.addOffense")}
        </button>
        <button type="button" onClick={() => addEntity("defense")}>
          {t("editor.toolbar.addDefense")}
        </button>
        <button type="button" onClick={undo} disabled={past.length === 0}>
          {t("editor.toolbar.undo")}
        </button>
        <button type="button" onClick={redo} disabled={future.length === 0}>
          {t("editor.toolbar.redo")}
        </button>
        {frame.disc.heldBy && (
          <button type="button" onClick={freeDisc}>
            {t("editor.toolbar.freeDisc")}
          </button>
        )}
      </div>

      {showRosterWarning && (
        <p className="warning">
          {t("editor.toolbar.rosterWarning", { max: MAX_RECOMMENDED_PER_TEAM })}
        </p>
      )}

      {selectedEntity && (
        <div className="selection-panel">
          <span>
            {selectedEntity.label} ({selectedEntity.team})
          </span>
          <button type="button" onClick={() => assignDiscTo(selectedEntity.id)}>
            {t("editor.toolbar.giveDisc")}
          </button>
          <button type="button" onClick={() => removeEntity(selectedEntity.id)}>
            {t("editor.toolbar.remove")}
          </button>
          <button type="button" onClick={() => selectEntity(null)}>
            {t("editor.toolbar.deselect")}
          </button>
        </div>
      )}
    </div>
  );
}
