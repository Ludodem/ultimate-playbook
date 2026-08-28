import { useTranslation } from "react-i18next";
import { actionFileName, buildAction } from "../../domain/action";
import { useActionEditorStore } from "../../state/actionEditorStore";
import { FrameActionsMenu } from "./FrameActionsMenu";

interface EditorActionsPanelProps {
  showGhostFrame: boolean;
  onToggleGhostFrame: (show: boolean) => void;
}

/**
 * Contenu du menu secondaire (nom de l'action, export, nouvelle action, ajout
 * de joueur, undo/redo, orientation, frame fantôme, actions de frame
 * secondaires) — voir docs/PRD.md §4.8/§4.9. Extrait dans son propre
 * composant pour être rendu soit dans le panneau flottant du menu ⋯ (écran
 * étroit), soit en permanence dans la colonne latérale (grand écran, voir
 * docs/PRD.md §4.8quater et `PositionEditor.tsx`) — sans dupliquer le JSX
 * entre les deux. Lit l'essentiel directement dans le store, comme les autres
 * composants de la barre Frames ; seule la bascule "frame fantôme" (état
 * local à `PositionEditor.tsx`, pas dans le store) est reçue en props.
 */
export function EditorActionsPanel({
  showGhostFrame,
  onToggleGhostFrame,
}: EditorActionsPanelProps) {
  const { t } = useTranslation();
  const actionId = useActionEditorStore((s) => s.actionId);
  const actionName = useActionEditorStore((s) => s.actionName);
  const setActionName = useActionEditorStore((s) => s.setActionName);
  const tags = useActionEditorStore((s) => s.tags);
  const defaultTransitionMs = useActionEditorStore((s) => s.defaultTransitionMs);
  const createdAt = useActionEditorStore((s) => s.createdAt);
  const updatedAt = useActionEditorStore((s) => s.updatedAt);
  const resetToSetup = useActionEditorStore((s) => s.resetToSetup);
  const fieldConfig = useActionEditorStore((s) => s.fieldConfig);
  const frames = useActionEditorStore((s) => s.frames);
  const currentFrameId = useActionEditorStore((s) => s.currentFrameId);
  const selectedEntityId = useActionEditorStore((s) => s.selectedEntityId);
  const addEntity = useActionEditorStore((s) => s.addEntity);
  const removeEntity = useActionEditorStore((s) => s.removeEntity);
  const undo = useActionEditorStore((s) => s.undo);
  const redo = useActionEditorStore((s) => s.redo);
  const past = useActionEditorStore((s) => s.past);
  const future = useActionEditorStore((s) => s.future);
  const orientation = useActionEditorStore((s) => s.orientation);
  const setOrientation = useActionEditorStore((s) => s.setOrientation);

  const frame = frames.find((f) => f.id === currentFrameId) ?? null;
  if (!fieldConfig || !frame || !actionId || !createdAt || !updatedAt) return null;

  const selectedEntity = frame.entities.find((e) => e.id === selectedEntityId) ?? null;

  const handleExport = () => {
    const action = buildAction({
      id: actionId,
      name: actionName,
      tags,
      fieldConfig,
      defaultTransitionMs,
      frames,
      createdAt,
      updatedAt,
    });
    const blob = new Blob([JSON.stringify(action, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = actionFileName(actionName);
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <span className="menu-section-label">{t("editor.setup.name")}</span>
      <input
        type="text"
        className="action-name-input"
        value={actionName}
        onChange={(e) => setActionName(e.target.value)}
        aria-label={t("editor.setup.name")}
      />
      <div className="menu-group">
        <button type="button" onClick={handleExport}>
          {t("editor.toolbar.export")}
        </button>
        <button type="button" onClick={resetToSetup}>
          {t("editor.toolbar.newAction")}
        </button>
      </div>

      <div className="menu-divider" />

      <div className="menu-group">
        <button type="button" onClick={() => addEntity("offense")}>
          {t("editor.toolbar.addOffense")}
        </button>
        <button type="button" onClick={() => addEntity("defense")}>
          {t("editor.toolbar.addDefense")}
        </button>
      </div>
      <div className="menu-group">
        <button type="button" onClick={undo} disabled={past.length === 0}>
          {t("editor.toolbar.undo")}
        </button>
        <button type="button" onClick={redo} disabled={future.length === 0}>
          {t("editor.toolbar.redo")}
        </button>
      </div>
      {selectedEntity && (
        <button
          type="button"
          className="danger"
          onClick={() => {
            removeEntity(selectedEntity.id);
          }}
        >
          {t("editor.toolbar.removeNamed", { label: selectedEntity.label })}
        </button>
      )}

      <div className="menu-divider" />

      <span className="menu-section-label">{t("editor.orientation.title")}</span>
      <div className="orientation-switch">
        <button
          type="button"
          className={orientation === "portrait" ? "active" : ""}
          onClick={() => setOrientation("portrait")}
        >
          {t("editor.orientation.portrait")}
        </button>
        <button
          type="button"
          className={orientation === "landscape" ? "active" : ""}
          onClick={() => setOrientation("landscape")}
        >
          {t("editor.orientation.landscape")}
        </button>
      </div>

      <div className="menu-divider" />

      {frame.parentId !== null && (
        <label className="checkbox-option ghost-toggle">
          <input
            type="checkbox"
            checked={showGhostFrame}
            onChange={(e) => onToggleGhostFrame(e.target.checked)}
          />
          {t("editor.toolbar.ghostFrameToggle")}
        </label>
      )}

      <div className="menu-divider" />

      <span className="menu-section-label">{t("editor.frames.title")}</span>
      <FrameActionsMenu />
    </>
  );
}
