import { useState } from "react";
import { useTranslation } from "react-i18next";
import { computeCurrentPathView, getChildren } from "../../domain/tree";
import { useActionEditorStore } from "../../state/actionEditorStore";

/**
 * Barre "Frames" toujours visible, en espace dédié (jamais posée par-dessus
 * le terrain) — voir docs/PRD.md §4.8. Se limite à la navigation (chemin
 * courant + options d'un embranchement) et aux deux actions les plus
 * fréquentes en construisant un play (frame suivante, nouvelle branche) :
 * le reste (renommage, réordonnancement, suppression, note) vit dans le menu
 * secondaire (`FrameActionsMenu.tsx`).
 */
export function FrameTimeline() {
  const { t } = useTranslation();
  const frames = useActionEditorStore((s) => s.frames);
  const currentFrameId = useActionEditorStore((s) => s.currentFrameId);
  const selectFrame = useActionEditorStore((s) => s.selectFrame);
  const addNextFrame = useActionEditorStore((s) => s.addNextFrame);
  const addBranch = useActionEditorStore((s) => s.addBranch);

  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [branchLabelDraft, setBranchLabelDraft] = useState("");

  if (!currentFrameId) return null;

  const { chain, forkOptions } = computeCurrentPathView(frames, currentFrameId);
  if (chain.length === 0) return null;

  const canExtend = getChildren(frames, currentFrameId).length === 0;

  const handleConfirmBranch = () => {
    const label = branchLabelDraft.trim();
    if (!label) return;
    addBranch(label);
    setBranchLabelDraft("");
    setIsAddingBranch(false);
  };

  return (
    <div className="frame-timeline">
      <span className="frame-timeline-label">{t("editor.frames.title")}</span>
      <div className="frame-row">
        {chain.map((frame) => (
          <button
            key={frame.id}
            type="button"
            className={`frame-chip${frame.id === currentFrameId ? " is-current" : ""}`}
            onClick={() => selectFrame(frame.id)}
            aria-label={t("editor.frames.jumpTo", { n: chain.indexOf(frame) + 1 })}
          >
            {chain.indexOf(frame) + 1}
          </button>
        ))}

        {forkOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className="branch-pill"
            onClick={() => selectFrame(option.id)}
          >
            {option.branchLabel}
          </button>
        ))}

        <div className="frame-row-actions">
          <button type="button" className="chip-branch" onClick={() => setIsAddingBranch(true)}>
            {t("editor.frames.addBranch")}
          </button>
          <button
            type="button"
            className="chip-add"
            onClick={addNextFrame}
            disabled={!canExtend}
            aria-label={t("editor.frames.next")}
          >
            +
          </button>
        </div>
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
    </div>
  );
}
