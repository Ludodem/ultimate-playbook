import { useState } from "react";
import { useTranslation } from "react-i18next";
import { computeCurrentPathView, getChildren } from "../../domain/tree";
import { useActionEditorStore } from "../../state/actionEditorStore";

/** Nombre de couleurs distinctes avant que la palette ne boucle — un embranchement
 * a rarement plus de 2-3 options en pratique. */
const BRANCH_COLOR_COUNT = 4;

/**
 * Barre "Frames" toujours visible, en espace dédié (jamais posée par-dessus
 * le terrain) — voir docs/PRD.md §4.8. Se limite à la navigation (chemin
 * courant + embranchements traversés) et aux deux actions les plus fréquentes
 * en construisant un play (frame suivante, nouvelle branche) : le reste
 * (renommage, réordonnancement, suppression, note) vit dans le menu
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

  const { segments } = computeCurrentPathView(frames, currentFrameId);
  if (segments.length === 0) return null;

  const canExtend = getChildren(frames, currentFrameId).length === 0;

  // Nom de la branche la plus proche de la position courante (dernier
  // embranchement résolu du chemin), affiché dans le libellé de la barre pour
  // rester lisible même sans repérer visuellement les pastilles colorées.
  const activeBranch = [...segments]
    .reverse()
    .find((s) => s.kind === "branch" && s.activeId !== null);
  const activeBranchLabel =
    activeBranch?.kind === "branch"
      ? activeBranch.options.find((o) => o.id === activeBranch.activeId)?.branchLabel
      : undefined;

  const handleConfirmBranch = () => {
    const label = branchLabelDraft.trim();
    if (!label) return;
    addBranch(label);
    setBranchLabelDraft("");
    setIsAddingBranch(false);
  };

  // Numérotation d'affichage (1, 2, 3...) des seuls segments "frame", et
  // couleur de branche à reporter sur les frames qui en font partie (toutes
  // celles qui suivent un embranchement résolu, jusqu'au suivant) — calculées
  // à part pour ne pas muter de variable pendant le rendu du `.map` ci-dessous.
  const frameNumbers = new Map<string, number>();
  const frameBranchColors = new Map<string, number>();
  let activeColorIndex: number | null = null;
  for (const segment of segments) {
    if (segment.kind === "branch") {
      activeColorIndex =
        segment.activeId !== null
          ? segment.options.findIndex((o) => o.id === segment.activeId) % BRANCH_COLOR_COUNT
          : activeColorIndex;
    } else {
      frameNumbers.set(segment.frame.id, frameNumbers.size + 1);
      if (activeColorIndex !== null) frameBranchColors.set(segment.frame.id, activeColorIndex);
    }
  }

  return (
    <div className="frame-timeline">
      <span className="frame-timeline-label">
        {t("editor.frames.title")}
        {activeBranchLabel && ` · ${activeBranchLabel}`}
      </span>
      <div className="frame-row">
        {segments.map((segment, index) => {
          if (segment.kind === "frame") {
            const frameNumber = frameNumbers.get(segment.frame.id);
            const colorIndex = frameBranchColors.get(segment.frame.id);
            const colorClass = colorIndex !== undefined ? ` branch-color-${colorIndex}` : "";
            return (
              <button
                key={segment.frame.id}
                type="button"
                className={`frame-chip${segment.frame.id === currentFrameId ? " is-current" : ""}${colorClass}`}
                onClick={() => selectFrame(segment.frame.id)}
                aria-label={t("editor.frames.jumpTo", { n: frameNumber })}
              >
                {frameNumber}
              </button>
            );
          }
          return (
            <div className="branch-tabs" key={`branch-${index}`}>
              {segment.options.map((option, optionIndex) => (
                <button
                  key={option.id}
                  type="button"
                  className={`branch-pill branch-color-${optionIndex % BRANCH_COLOR_COUNT}${
                    option.id === segment.activeId ? " is-active" : ""
                  }`}
                  onClick={() => selectFrame(option.id)}
                >
                  {option.branchLabel}
                </button>
              ))}
            </div>
          );
        })}

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
