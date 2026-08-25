import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getChildren } from "../../domain/tree";
import { useActionEditorStore } from "../../state/actionEditorStore";

/**
 * Actions de frame secondaires (créer une branche, renommer, réordonner,
 * supprimer, note) — regroupées dans le menu ⋯ plutôt que dans la barre
 * Frames toujours visible, voir docs/PRD.md §4.8.
 */
export function FrameActionsMenu() {
  const { t } = useTranslation();
  const frames = useActionEditorStore((s) => s.frames);
  const currentFrameId = useActionEditorStore((s) => s.currentFrameId);
  const addBranch = useActionEditorStore((s) => s.addBranch);
  const renameBranch = useActionEditorStore((s) => s.renameBranch);
  const deleteFrame = useActionEditorStore((s) => s.deleteFrame);
  const moveFrameUp = useActionEditorStore((s) => s.moveFrameUp);
  const moveFrameDown = useActionEditorStore((s) => s.moveFrameDown);
  const setNote = useActionEditorStore((s) => s.setNote);

  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [branchLabelDraft, setBranchLabelDraft] = useState("");

  const currentFrame = frames.find((f) => f.id === currentFrameId) ?? null;
  if (!currentFrame) return null;

  const isRoot = currentFrame.parentId === null;
  const parent = frames.find((f) => f.id === currentFrame.parentId);
  const parentIsFork = parent ? getChildren(frames, parent.id).length > 1 : false;
  const canMoveUp = !isRoot && !parentIsFork;
  const canMoveDown = getChildren(frames, currentFrame.id).length === 1;

  const handleConfirmBranch = () => {
    const label = branchLabelDraft.trim();
    if (!label) return;
    addBranch(label);
    setBranchLabelDraft("");
    setIsAddingBranch(false);
  };

  return (
    <>
      <div className="menu-group">
        <button type="button" onClick={() => setIsAddingBranch(true)}>
          {t("editor.frames.addBranch")}
        </button>
        <button type="button" onClick={() => moveFrameUp(currentFrame.id)} disabled={!canMoveUp}>
          {t("editor.frames.moveUp")}
        </button>
        <button
          type="button"
          onClick={() => moveFrameDown(currentFrame.id)}
          disabled={!canMoveDown}
        >
          {t("editor.frames.moveDown")}
        </button>
        <button type="button" onClick={() => deleteFrame(currentFrame.id)} disabled={isRoot}>
          {t("editor.frames.delete")}
        </button>
      </div>

      {isAddingBranch && (
        <div className="branch-form">
          <input
            value={branchLabelDraft}
            onChange={(e) => setBranchLabelDraft(e.target.value)}
            placeholder={t("editor.frames.branchLabelPlaceholder")}
            autoFocus
          />
          <button type="button" onClick={handleConfirmBranch}>
            {t("editor.frames.confirm")}
          </button>
          <button type="button" onClick={() => setIsAddingBranch(false)}>
            {t("editor.frames.cancel")}
          </button>
        </div>
      )}

      {currentFrame.branchLabel !== undefined && (
        <label className="branch-rename">
          {t("editor.frames.branchLabel")}
          <input
            value={currentFrame.branchLabel}
            onChange={(e) => renameBranch(currentFrame.id, e.target.value)}
          />
        </label>
      )}

      <label className="frame-note">
        {t("editor.frames.note")}
        <textarea value={currentFrame.note ?? ""} onChange={(e) => setNote(e.target.value)} />
      </label>
    </>
  );
}
