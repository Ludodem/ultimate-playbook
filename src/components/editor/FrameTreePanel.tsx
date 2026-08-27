import type { CSSProperties } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { computeFullTreeRows, getChildren } from "../../domain/tree";
import { useActionEditorStore } from "../../state/actionEditorStore";

/**
 * Panneau "Frames" en colonne latérale (grand écran, voir docs/PRD.md
 * §4.8bis) : alternative à la barre du bas (`FrameTimeline.tsx`) qui montre
 * l'**arbre complet** plutôt que le seul chemin courant, pour profiter de
 * l'espace resté libre sur les côtés du terrain plutôt que de le laisser
 * inutilisé. `PositionEditor.tsx` choisit laquelle des deux afficher selon
 * l'espace mesuré ; jamais les deux en même temps.
 */
export function FrameTreePanel() {
  const { t } = useTranslation();
  const frames = useActionEditorStore((s) => s.frames);
  const currentFrameId = useActionEditorStore((s) => s.currentFrameId);
  const selectFrame = useActionEditorStore((s) => s.selectFrame);
  const addNextFrame = useActionEditorStore((s) => s.addNextFrame);
  const addBranch = useActionEditorStore((s) => s.addBranch);

  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [branchLabelDraft, setBranchLabelDraft] = useState("");

  if (!currentFrameId) return null;

  const rows = computeFullTreeRows(frames);
  const canExtend = getChildren(frames, currentFrameId).length === 0;

  const handleConfirmBranch = () => {
    const label = branchLabelDraft.trim();
    if (!label) return;
    addBranch(label);
    setBranchLabelDraft("");
    setIsAddingBranch(false);
  };

  return (
    <div className="frame-tree-panel">
      <span className="frame-timeline-label">{t("editor.frames.title")}</span>

      <div className="frame-tree-rows">
        {rows.map((row) => {
          const colorClass =
            row.branchColorIndex !== null ? ` branch-color-${row.branchColorIndex}` : "";
          return (
            <button
              key={row.frame.id}
              type="button"
              className={`frame-tree-row${row.frame.id === currentFrameId ? " is-current" : ""}${colorClass}`}
              style={{ "--frame-tree-depth": row.visualDepth } as CSSProperties}
              onClick={() => selectFrame(row.frame.id)}
              aria-label={t("editor.frames.jumpTo", { n: row.generation })}
              aria-current={row.frame.id === currentFrameId ? "true" : undefined}
            >
              <span className="frame-tree-dot" />
              <span className="frame-tree-generation">{row.generation}</span>
              {row.frame.branchLabel && (
                <span className="frame-tree-branch-label">{row.frame.branchLabel}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="frame-tree-actions">
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
