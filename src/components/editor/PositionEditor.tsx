import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Field } from "../field";
import { PlaybackView } from "../playback";
import { resolveDiscPosition, type Position } from "../../domain/disc";
import { controlPointForMidpoint, curveMidpoint } from "../../domain/interpolation";
import { MAX_RECOMMENDED_PER_TEAM, useActionEditorStore } from "../../state/actionEditorStore";
import { FrameTimeline } from "./FrameTimeline";

type ViewMode = "edit" | "play";

/** Éditeur de positions d'une action en cours (Phases 3-6, docs/ROADMAP.md). */
export function PositionEditor() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [draftMidpoint, setDraftMidpoint] = useState<Position | null>(null);
  const fieldConfig = useActionEditorStore((s) => s.fieldConfig);
  const frames = useActionEditorStore((s) => s.frames);
  const currentFrameId = useActionEditorStore((s) => s.currentFrameId);
  const frame = frames.find((f) => f.id === currentFrameId) ?? null;
  const selectedEntityId = useActionEditorStore((s) => s.selectedEntityId);
  const selectEntity = useActionEditorStore((s) => s.selectEntity);
  const moveEntity = useActionEditorStore((s) => s.moveEntity);
  const moveDisc = useActionEditorStore((s) => s.moveDisc);
  const addEntity = useActionEditorStore((s) => s.addEntity);
  const removeEntity = useActionEditorStore((s) => s.removeEntity);
  const assignDiscTo = useActionEditorStore((s) => s.assignDiscTo);
  const freeDisc = useActionEditorStore((s) => s.freeDisc);
  const setDiscCurveControlPoint = useActionEditorStore((s) => s.setDiscCurveControlPoint);
  const undo = useActionEditorStore((s) => s.undo);
  const redo = useActionEditorStore((s) => s.redo);
  const past = useActionEditorStore((s) => s.past);
  const future = useActionEditorStore((s) => s.future);

  if (!fieldConfig || !frame) return null;

  const selectedEntity = frame.entities.find((e) => e.id === selectedEntityId) ?? null;
  const offenseCount = frame.entities.filter((e) => e.team === "offense").length;
  const defenseCount = frame.entities.filter((e) => e.team === "defense").length;
  const showRosterWarning =
    offenseCount > MAX_RECOMMENDED_PER_TEAM || defenseCount > MAX_RECOMMENDED_PER_TEAM;

  // Trajectoire courbe du disque (Phase 6) : seulement pertinente si le disque
  // change réellement de position entre la frame précédente et la frame courante.
  const previousFrame = frame.parentId
    ? (frames.find((f) => f.id === frame.parentId) ?? null)
    : null;
  const discFromPosition = previousFrame
    ? resolveDiscPosition(previousFrame.disc, previousFrame.entities)
    : null;
  const discToPosition = resolveDiscPosition(frame.disc, frame.entities);
  const discMoved =
    discFromPosition &&
    discToPosition &&
    (discFromPosition.x !== discToPosition.x || discFromPosition.y !== discToPosition.y);
  const storedControlPoint = frame.incomingCurves?.disc;
  // Le sommet affiché/déplacé est le point réellement SUR la courbe (t=0.5),
  // pas le point de contrôle stocké — voir domain/interpolation.ts. Sans
  // courbe définie, les deux coïncident avec le milieu du segment droit.
  const restingMidpoint =
    discFromPosition && discToPosition
      ? storedControlPoint
        ? curveMidpoint(discFromPosition, storedControlPoint, discToPosition)
        : {
            x: (discFromPosition.x + discToPosition.x) / 2,
            y: (discFromPosition.y + discToPosition.y) / 2,
          }
      : null;
  const displayedMidpoint = draftMidpoint ?? restingMidpoint;

  return (
    <div className="editor">
      <div className="view-mode-switch">
        <button type="button" onClick={() => setViewMode("edit")} disabled={viewMode === "edit"}>
          {t("editor.viewMode.edit")}
        </button>
        <button type="button" onClick={() => setViewMode("play")} disabled={viewMode === "play"}>
          {t("editor.viewMode.play")}
        </button>
      </div>

      {viewMode === "play" ? (
        <PlaybackView />
      ) : (
        <>
          <div className="field-demo">
            <Field
              fieldConfig={fieldConfig}
              frame={frame}
              interactive={{
                selectedEntityId,
                onEntitySelect: selectEntity,
                onEntityMove: moveEntity,
                onEntityDelete: removeEntity,
                onDiscMove: moveDisc,
                onFieldClick: (x, y) => {
                  if (selectedEntityId) moveEntity(selectedEntityId, x, y);
                },
              }}
              discCurveEditor={
                discMoved && discFromPosition && discToPosition && displayedMidpoint
                  ? {
                      fromPosition: discFromPosition,
                      toPosition: discToPosition,
                      midpoint: displayedMidpoint,
                      onDragMove: setDraftMidpoint,
                      onDragEnd: (midpoint) => {
                        setDiscCurveControlPoint(
                          controlPointForMidpoint(discFromPosition, discToPosition, midpoint),
                        );
                        setDraftMidpoint(null);
                      },
                    }
                  : undefined
              }
            />
          </div>

          <p className="hint">{t("editor.toolbar.selectionHint")}</p>
          {discMoved && (
            <p className="hint">
              {t("editor.curve.hint")}
              {storedControlPoint && (
                <button
                  type="button"
                  className="curve-reset"
                  onClick={() => setDiscCurveControlPoint(null)}
                >
                  {t("editor.curve.reset")}
                </button>
              )}
            </p>
          )}

          <div className="toolbar">
            <button type="button" onClick={() => addEntity("offense")}>
              {t("editor.toolbar.addOffense")}
            </button>
            <button type="button" onClick={() => addEntity("defense")}>
              {t("editor.toolbar.addDefense")}
            </button>
            <button type="button" onClick={undo} disabled={past.length === 0}>
              {t("editor.toolbar.undo")}
            </button>
            <button type="button" onClick={redo} disabled={future.length === 0}>
              {t("editor.toolbar.redo")}
            </button>
            {frame.disc.heldBy && (
              <button type="button" onClick={freeDisc}>
                {t("editor.toolbar.freeDisc")}
              </button>
            )}
          </div>

          {showRosterWarning && (
            <p className="warning">
              {t("editor.toolbar.rosterWarning", { max: MAX_RECOMMENDED_PER_TEAM })}
            </p>
          )}

          {selectedEntity && (
            <div className="selection-panel">
              <span>
                {selectedEntity.label} ({selectedEntity.team})
              </span>
              <button type="button" onClick={() => assignDiscTo(selectedEntity.id)}>
                {t("editor.toolbar.giveDisc")}
              </button>
              <button type="button" onClick={() => removeEntity(selectedEntity.id)}>
                {t("editor.toolbar.remove")}
              </button>
              <button type="button" onClick={() => selectEntity(null)}>
                {t("editor.toolbar.deselect")}
              </button>
            </div>
          )}

          <FrameTimeline />
        </>
      )}
    </div>
  );
}
