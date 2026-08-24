import type { Frame } from "../../domain/models";
import { getChildren } from "../../domain/tree";

interface BranchChainProps {
  frames: Frame[];
  /** Frame par laquelle commencer ce segment de chaîne (racine de l'action ou tête d'une branche). */
  startId: string;
  displayOrder: Map<string, number>;
  currentFrameId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Rendu récursif d'un embranchement : une chaîne linéaire de vignettes tant
 * qu'il n'y a qu'un seul enfant, puis une piste par branche (chacune étiquetée
 * par son `branchLabel`) dès qu'une frame a plusieurs enfants — voir
 * docs/ARCHITECTURE.md §7.
 */
export function BranchChain({
  frames,
  startId,
  displayOrder,
  currentFrameId,
  onSelect,
}: BranchChainProps) {
  const chain: Frame[] = [];
  let cursorId: string | undefined = startId;
  while (cursorId) {
    const frame = frames.find((f) => f.id === cursorId);
    if (!frame) break;
    chain.push(frame);
    const children = getChildren(frames, cursorId);
    cursorId = children.length === 1 ? children[0].id : undefined;
  }

  const last = chain[chain.length - 1];
  const branches = last ? getChildren(frames, last.id) : [];

  return (
    <div className="branch-chain">
      <div className="frame-row">
        {chain.map((frame) => (
          <button
            key={frame.id}
            type="button"
            className={`frame-chip${frame.id === currentFrameId ? " is-current" : ""}`}
            onClick={() => onSelect(frame.id)}
          >
            {displayOrder.get(frame.id)}
          </button>
        ))}
      </div>

      {branches.length > 1 && (
        <div className="branches">
          {branches.map((branch) => (
            <div key={branch.id} className="branch">
              <span className="branch-label">{branch.branchLabel}</span>
              <BranchChain
                frames={frames}
                startId={branch.id}
                displayOrder={displayOrder}
                currentFrameId={currentFrameId}
                onSelect={onSelect}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
