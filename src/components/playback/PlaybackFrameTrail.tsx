import { useTranslation } from "react-i18next";
import { BRANCH_COLOR_COUNT, computeCurrentPathView } from "../../domain/tree";
import { useActionEditorStore } from "../../state/actionEditorStore";

interface PlaybackFrameTrailProps {
  /** Frame actuellement affichée : en pas à pas, la frame de départ de la
   * transition en cours (ou la frame courante hors animation) ; en fluide, la
   * frame de départ du segment en cours d'interpolation. */
  currentFrameId: string | null;
}

/**
 * Représentation visuelle "où en est-on dans l'arbre" en mode lecture,
 * pas à pas comme fluide — voir docs/PRD.md §4.4. Même rendu que la barre
 * Étapes de l'éditeur (`FrameTimeline.tsx`, `computeCurrentPathView`), mais
 * purement informatif : ni bouton d'ajout, ni navigation par clic — la
 * lecture a son propre mécanisme d'avancement (pas à pas ou chemin choisi à
 * l'avance en fluide), on ne veut pas ouvrir un second moyen de sauter d'une
 * frame à l'autre qui court-circuiterait ce mécanisme. D'où `<span>` plutôt
 * que `<button>` : pas d'affordance de clic à donner à quelque chose qui ne
 * fait rien au clic.
 */
export function PlaybackFrameTrail({ currentFrameId }: PlaybackFrameTrailProps) {
  const { t } = useTranslation();
  const frames = useActionEditorStore((s) => s.frames);
  const { segments } = computeCurrentPathView(frames, currentFrameId);
  if (segments.length === 0) return null;

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
    <div className="frame-timeline playback-frame-trail">
      <span className="frame-timeline-label">{t("editor.frames.title")}</span>
      <div className="frame-row">
        {segments.map((segment, index) => {
          if (segment.kind === "frame") {
            const frameNumber = frameNumbers.get(segment.frame.id);
            const colorIndex = frameBranchColors.get(segment.frame.id);
            const colorClass = colorIndex !== undefined ? ` branch-color-${colorIndex}` : "";
            return (
              <span
                key={segment.frame.id}
                className={`frame-chip${segment.frame.id === currentFrameId ? " is-current" : ""}${colorClass}`}
              >
                {frameNumber}
              </span>
            );
          }
          return (
            <div className="branch-tabs" key={`branch-${index}`}>
              {segment.options.map((option, optionIndex) => (
                <span
                  key={option.id}
                  className={`branch-pill branch-color-${optionIndex % BRANCH_COLOR_COUNT}${
                    option.id === segment.activeId ? " is-active" : ""
                  }`}
                >
                  {option.branchLabel}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
