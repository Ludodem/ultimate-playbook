import { useTranslation } from "react-i18next";
import { getChildren } from "../../domain/tree";
import { useActionEditorStore } from "../../state/actionEditorStore";

/**
 * Actions de frame secondaires (renommer une branche, réordonner, supprimer,
 * note) — regroupées dans le menu ⋯ plutôt que dans la barre Frames toujours
 * visible, voir docs/PRD.md §4.8. Créer une branche est en revanche assez
 * fréquent pour rester directement dans la barre Frames (`FrameTimeline.tsx`).
 */
export function FrameActionsMenu() {
  const { t } = useTranslation();
  const frames = useActionEditorStore((s) => s.frames);
  const currentFrameId = useActionEditorStore((s) => s.currentFrameId);
  const renameBranch = useActionEditorStore((s) => s.renameBranch);
  const deleteFrame = useActionEditorStore((s) => s.deleteFrame);
  const moveFrameUp = useActionEditorStore((s) => s.moveFrameUp);
  const moveFrameDown = useActionEditorStore((s) => s.moveFrameDown);
  const setNote = useActionEditorStore((s) => s.setNote);

  const currentFrame = frames.find((f) => f.id === currentFrameId) ?? null;
  if (!currentFrame) return null;

  const isRoot = currentFrame.parentId === null;
  const parent = frames.find((f) => f.id === currentFrame.parentId);
  const parentIsFork = parent ? getChildren(frames, parent.id).length > 1 : false;
  const canMoveUp = !isRoot && !parentIsFork;
  const canMoveDown = getChildren(frames, currentFrame.id).length === 1;

  return (
    <>
      <div className="menu-group">
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
        <button
          type="button"
          className="danger"
          onClick={() => deleteFrame(currentFrame.id)}
          disabled={isRoot}
        >
          {t("editor.frames.delete")}
        </button>
      </div>

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
