import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Field } from "../field";
import { buildInterpolatedFrame } from "../../domain/interpolation";
import { resolveTransitionMs } from "../../domain/playback";
import { getChildren, resolvePath } from "../../domain/tree";
import { useActionEditorStore } from "../../state/actionEditorStore";
import { ForkChoice } from "./ForkChoice";

const SPEED_OPTIONS = [0.5, 1, 1.5, 2];

/**
 * Lecture fluide (Phase 5, docs/ROADMAP.md) : le chemin complet racine → feuille
 * se choisit d'abord (embranchement par embranchement, jamais d'interruption
 * en cours d'animation), puis s'anime via requestAnimationFrame.
 */
export function FluidPlayback() {
  const { t } = useTranslation();
  const fieldConfig = useActionEditorStore((s) => s.fieldConfig);
  const frames = useActionEditorStore((s) => s.frames);

  const [choices, setChoices] = useState<Record<string, string>>({});
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const segmentStartRef = useRef(0);

  const path = useMemo(() => resolvePath(frames, choices), [frames, choices]);
  const lastResolved = path[path.length - 1];
  const pendingOptions = lastResolved ? getChildren(frames, lastResolved.id) : [];
  const isPathComplete = pendingOptions.length === 0;
  const canPlay = isPathComplete && path.length > 1;

  useEffect(() => {
    if (!isPlaying || !isPathComplete || segmentIndex >= path.length - 1) return undefined;

    const to = path[segmentIndex + 1];
    const durationMs = resolveTransitionMs(to) / speedMultiplier;
    segmentStartRef.current = performance.now() - progress * durationMs;

    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - segmentStartRef.current;
      const next = Math.min(1, elapsed / durationMs);
      setProgress(next);
      if (next < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setSegmentIndex((i) => i + 1);
        setProgress(0);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // `progress` est lu une seule fois au (re)démarrage de l'effet (pour reprendre
    // après une pause), pas à chaque tick — l'exclure évite un redémarrage en boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, segmentIndex, speedMultiplier, path, isPathComplete]);

  if (!fieldConfig || !lastResolved) return null;

  // `isPlaying` peut rester vrai après la fin du chemin (l'effet d'animation
  // s'arrête juste de ticker) : on le dérive plutôt que de le forcer via un
  // second effet, pour rester dans les règles React (pas de setState dans un effet).
  const atEnd = isPathComplete && segmentIndex >= path.length - 1;

  const handleChoose = (id: string) => {
    setChoices((prev) => ({ ...prev, [lastResolved.id]: id }));
  };

  const handleRestart = () => {
    setSegmentIndex(0);
    setProgress(0);
    setIsPlaying(false);
  };

  const handleChangePath = () => {
    setChoices({});
    handleRestart();
  };

  const handleTogglePlay = () => {
    if (atEnd) {
      setSegmentIndex(0);
      setProgress(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  };

  const displayFrame =
    isPathComplete && segmentIndex < path.length - 1
      ? buildInterpolatedFrame(path[segmentIndex], path[segmentIndex + 1], progress)
      : path[path.length - 1];

  return (
    <>
      <div className="field-stage">
        <div className="field-demo">
          <Field fieldConfig={fieldConfig} frame={displayFrame} />
        </div>

        {displayFrame.note && (
          <div className="field-banner-stack field-banner-stack-bottom">
            <p className="frame-note-display field-banner">{displayFrame.note}</p>
          </div>
        )}
      </div>

      <div className="playback-dock">
        {!isPathComplete && <ForkChoice options={pendingOptions} onChoose={handleChoose} />}

        {isPathComplete && (
          <div className="playback-controls">
            <button type="button" onClick={handleTogglePlay} disabled={!canPlay}>
              {isPlaying && !atEnd ? t("playback.pause") : t("playback.play")}
            </button>
            <button type="button" onClick={handleRestart}>
              {t("playback.restart")}
            </button>
            {Object.keys(choices).length > 0 && (
              <button type="button" onClick={handleChangePath}>
                {t("playback.changePath")}
              </button>
            )}
            <div className="speed-selector">
              <span>{t("playback.speed")}</span>
              {SPEED_OPTIONS.map((speed) => (
                <button
                  key={speed}
                  type="button"
                  className={speed === speedMultiplier ? "is-current" : ""}
                  onClick={() => setSpeedMultiplier(speed)}
                >
                  {speed}×
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
