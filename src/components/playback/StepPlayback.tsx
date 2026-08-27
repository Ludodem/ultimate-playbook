import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Field } from "../field";
import { buildInterpolatedFrame } from "../../domain/interpolation";
import { resolveTransitionMs } from "../../domain/playback";
import { getChildren, getRootFrame } from "../../domain/tree";
import { useActionEditorStore } from "../../state/actionEditorStore";
import { ForkChoice } from "./ForkChoice";

/**
 * Lecture pas à pas (Phase 5, docs/ROADMAP.md) : navigation manuelle, choix
 * inline entre branches à un embranchement. Avancer ("suivant" ou un choix de
 * branche) anime la transition au lieu d'un saut immédiat ; revenir en arrière
 * reste instantané.
 */
export function StepPlayback() {
  const { t } = useTranslation();
  const fieldConfig = useActionEditorStore((s) => s.fieldConfig);
  const frames = useActionEditorStore((s) => s.frames);
  const orientation = useActionEditorStore((s) => s.orientation);
  const root = getRootFrame(frames);
  const [currentFrameId, setCurrentFrameId] = useState(root?.id ?? null);
  const [animatingToId, setAnimatingToId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const startRef = useRef(0);

  const currentFrame = frames.find((f) => f.id === currentFrameId) ?? root;
  const animatingTo = animatingToId ? frames.find((f) => f.id === animatingToId) : undefined;

  useEffect(() => {
    if (!animatingTo || !currentFrame) return undefined;

    const durationMs = resolveTransitionMs(animatingTo);
    startRef.current = performance.now();

    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const next = Math.min(1, elapsed / durationMs);
      setProgress(next);
      if (next < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setCurrentFrameId(animatingTo.id);
        setAnimatingToId(null);
        setProgress(0);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animatingTo, currentFrame]);

  if (!fieldConfig || !root || !currentFrame) return null;

  const children = getChildren(frames, currentFrame.id);
  const isAnimating = animatingToId !== null;

  const advanceTo = (id: string) => {
    if (isAnimating) return;
    setAnimatingToId(id);
  };

  const displayFrame = animatingTo
    ? buildInterpolatedFrame(currentFrame, animatingTo, progress)
    : currentFrame;

  return (
    <>
      <div className="field-stage">
        <div className="field-demo">
          <Field
            fieldConfig={fieldConfig}
            frame={displayFrame}
            orientation={orientation}
            nextFrame={!isAnimating && children.length === 1 ? children[0] : undefined}
          />
        </div>

        {displayFrame.note && (
          <div className="field-banner-stack field-banner-stack-bottom">
            <p className="frame-note-display field-banner">{displayFrame.note}</p>
          </div>
        )}
      </div>

      <div className="playback-dock">
        {children.length > 1 && (
          <ForkChoice options={children} onChoose={advanceTo} disabled={isAnimating} />
        )}

        <div className="playback-controls">
          <button
            type="button"
            onClick={() => currentFrame.parentId && setCurrentFrameId(currentFrame.parentId)}
            disabled={!currentFrame.parentId || isAnimating}
          >
            {t("playback.previous")}
          </button>

          {children.length === 1 && (
            <button type="button" onClick={() => advanceTo(children[0].id)} disabled={isAnimating}>
              {t("playback.next")}
            </button>
          )}

          {children.length === 0 && <span className="playback-end">{t("playback.end")}</span>}
        </div>
      </div>
    </>
  );
}
