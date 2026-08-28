import { useTranslation } from "react-i18next";
import { useActionEditorStore } from "../../state/actionEditorStore";

/**
 * Actions de frame secondaires (renommer une branche, note) — regroupées dans
 * le menu ⋯ plutôt que dans la barre Frames toujours visible, voir
 * docs/PRD.md §4.8. Créer une branche reste directement dans la barre Frames
 * (`FrameTimeline.tsx`/`FrameTreePanel.tsx`), comme supprimer une étape
 * (bouton corbeille à côté du "+") — réordonner (monter/descendre) a été
 * retiré, jugé inutile à l'usage.
 */
export function FrameActionsMenu() {
  const { t } = useTranslation();
  const frames = useActionEditorStore((s) => s.frames);
  const currentFrameId = useActionEditorStore((s) => s.currentFrameId);
  const renameBranch = useActionEditorStore((s) => s.renameBranch);
  const setNote = useActionEditorStore((s) => s.setNote);

  const currentFrame = frames.find((f) => f.id === currentFrameId) ?? null;
  if (!currentFrame) return null;

  return (
    <>
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
