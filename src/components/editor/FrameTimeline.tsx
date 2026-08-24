import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { computeDisplayOrder, getChildren, getRootFrame } from "../../domain/tree";
import { useActionEditorStore } from "../../state/actionEditorStore";
import { BranchChain } from "./BranchChain";

/** Timeline de frames avec support des branches (Phase 4, docs/ROADMAP.md). */
export function FrameTimeline() {
  const { t } = useTranslation();
  const frames = useActionEditorStore((s) => s.frames);
  const currentFrameId = useActionEditorStore((s) => s.currentFrameId);
  const selectFrame = useActionEditorStore((s) => s.selectFrame);
  const addNextFrame = useActionEditorStore((s) => s.addNextFrame);
  const addBranch = useActionEditorStore((s) => s.addBranch);
  const renameBranch = useActionEditorStore((s) => s.renameBranch);
  const deleteFrame = useActionEditorStore((s) => s.deleteFrame);
  const moveFrameUp = useActionEditorStore((s) => s.moveFrameUp);
  const moveFrameDown = useActionEditorStore((s) => s.moveFrameDown);
  const setNote = useActionEditorStore((s) => s.setNote);

  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [branchLabelDraft, setBranchLabelDraft] = useState("");

  const displayOrder = useMemo(() => computeDisplayOrder(frames), [frames]);
  const root = getRootFrame(frames);
  const currentFrame = frames.find((f) => f.id === currentFrameId) ?? null;

  if (!root || !currentFrame) return null;

  const canExtend = getChildren(frames, currentFrame.id).length === 0;
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
    <div className="frame-timeline">
      <h3>{t("editor.frames.title")}</h3>

      <BranchChain
        frames={frames}
        startId={root.id}
        displayOrder={displayOrder}
        currentFrameId={currentFrameId}
        onSelect={selectFrame}
      />

      <div className="frame-toolbar">
        <button type="button" onClick={addNextFrame} disabled={!canExtend}>
          {t("editor.frames.next")}
        </button>
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
    </div>
  );
}
