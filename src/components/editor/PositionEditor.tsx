import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Field } from "../field";
import { PlaybackView } from "../playback";
import { actionFileName, buildAction } from "../../domain/action";
import type { Position } from "../../domain/disc";
import { controlPointForMidpoint, curveMidpoint } from "../../domain/interpolation";
import { MAX_RECOMMENDED_PER_TEAM, useActionEditorStore } from "../../state/actionEditorStore";
import { FrameActionsMenu } from "./FrameActionsMenu";
import { FrameTimeline } from "./FrameTimeline";

type ViewMode = "edit" | "play";

/**
 * Éditeur de positions d'une action en cours (Phases 3-8, docs/ROADMAP.md).
 * Disposition : le terrain occupe tout l'écran en continu, la barre Frames a
 * un espace dédié (jamais posée par-dessus le terrain), et tout le reste vit
 * derrière un unique menu ⋯ — voir docs/PRD.md §4.8.
 */
export function PositionEditor() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [draftMidpoint, setDraftMidpoint] = useState<Position | null>(null);
  const [showGhostFrame, setShowGhostFrame] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const actionId = useActionEditorStore((s) => s.actionId);
  const actionName = useActionEditorStore((s) => s.actionName);
  const setActionName = useActionEditorStore((s) => s.setActionName);
  const tags = useActionEditorStore((s) => s.tags);
  const defaultTransitionMs = useActionEditorStore((s) => s.defaultTransitionMs);
  const createdAt = useActionEditorStore((s) => s.createdAt);
  const updatedAt = useActionEditorStore((s) => s.updatedAt);
  const resetToSetup = useActionEditorStore((s) => s.resetToSetup);
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
  const setDiscCurveControlPoint = useActionEditorStore((s) => s.setDiscCurveControlPoint);
  const undo = useActionEditorStore((s) => s.undo);
  const redo = useActionEditorStore((s) => s.redo);
  const past = useActionEditorStore((s) => s.past);
  const future = useActionEditorStore((s) => s.future);

  if (!fieldConfig || !frame || !actionId || !createdAt || !updatedAt) return null;

  const handleExport = () => {
    const action = buildAction({
      id: actionId,
      name: actionName,
      tags,
      fieldConfig,
      defaultTransitionMs,
      frames,
      createdAt,
      updatedAt,
    });
    const blob = new Blob([JSON.stringify(action, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = actionFileName(actionName);
    link.click();
    URL.revokeObjectURL(url);
  };

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
  const discFromPosition = previousFrame ? previousFrame.disc : null;
  const discToPosition = frame.disc;
  const discMoved =
    discFromPosition &&
    (discFromPosition.x !== discToPosition.x || discFromPosition.y !== discToPosition.y);
  const storedControlPoint = frame.incomingCurves?.disc;
  // Le sommet affiché/déplacé est le point réellement SUR la courbe (t=0.5),
  // pas le point de contrôle stocké — voir domain/interpolation.ts. Sans
  // courbe définie, les deux coïncident avec le milieu du segment droit.
  const restingMidpoint = discFromPosition
    ? storedControlPoint
      ? curveMidpoint(discFromPosition, storedControlPoint, discToPosition)
      : {
          x: (discFromPosition.x + discToPosition.x) / 2,
          y: (discFromPosition.y + discToPosition.y) / 2,
        }
    : null;
  const displayedMidpoint = draftMidpoint ?? restingMidpoint;

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="editor">
      {viewMode === "play" ? (
        <PlaybackView />
      ) : (
        <>
          <div className="field-stage">
            <div className="field-demo">
              <Field
                fieldConfig={fieldConfig}
                frame={frame}
                ghostFrame={showGhostFrame ? (previousFrame ?? undefined) : undefined}
                interactive={{
                  selectedEntityId,
                  onEntitySelect: (id) => selectEntity(selectedEntityId === id ? null : id),
                  onEntityMove: moveEntity,
                  onEntityDelete: removeEntity,
                  onDiscMove: moveDisc,
                  onFieldClick: (x, y) => {
                    if (selectedEntityId) moveEntity(selectedEntityId, x, y);
                  },
                }}
                discCurveEditor={
                  discMoved && discFromPosition && displayedMidpoint
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

            {(showRosterWarning || discMoved) && (
              <div className="field-banner-stack field-banner-stack-top">
                {showRosterWarning && (
                  <p className="warning field-banner">
                    {t("editor.toolbar.rosterWarning", { max: MAX_RECOMMENDED_PER_TEAM })}
                  </p>
                )}
                {discMoved && (
                  <p className="hint field-banner">
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
              </div>
            )}
          </div>

          <FrameTimeline />
        </>
      )}

      <div className="mode-switch">
        <button
          type="button"
          className={viewMode === "edit" ? "active" : ""}
          onClick={() => setViewMode("edit")}
        >
          {t("editor.viewMode.edit")}
        </button>
        <button
          type="button"
          className={viewMode === "play" ? "active" : ""}
          onClick={() => setViewMode("play")}
        >
          {t("editor.viewMode.play")}
        </button>
      </div>

      {viewMode === "edit" && (
        <>
          <button
            type="button"
            className="menu-fab"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={t("editor.toolbar.menu")}
          >
            ⋯
          </button>

          {menuOpen && (
            <>
              <div className="menu-scrim" onClick={closeMenu} />
              <div className="menu-panel">
                <span className="menu-section-label">{t("editor.setup.name")}</span>
                <input
                  type="text"
                  className="action-name-input"
                  value={actionName}
                  onChange={(e) => setActionName(e.target.value)}
                  aria-label={t("editor.setup.name")}
                />
                <div className="menu-group">
                  <button type="button" onClick={handleExport}>
                    {t("editor.toolbar.export")}
                  </button>
                  <button type="button" onClick={resetToSetup}>
                    {t("editor.toolbar.newAction")}
                  </button>
                </div>

                <div className="menu-divider" />

                <div className="menu-group">
                  <button type="button" onClick={() => addEntity("offense")}>
                    {t("editor.toolbar.addOffense")}
                  </button>
                  <button type="button" onClick={() => addEntity("defense")}>
                    {t("editor.toolbar.addDefense")}
                  </button>
                </div>
                <div className="menu-group">
                  <button type="button" onClick={undo} disabled={past.length === 0}>
                    {t("editor.toolbar.undo")}
                  </button>
                  <button type="button" onClick={redo} disabled={future.length === 0}>
                    {t("editor.toolbar.redo")}
                  </button>
                </div>
                {selectedEntity && (
                  <button
                    type="button"
                    onClick={() => {
                      removeEntity(selectedEntity.id);
                    }}
                  >
                    {t("editor.toolbar.removeNamed", { label: selectedEntity.label })}
                  </button>
                )}

                <div className="menu-divider" />

                {previousFrame && (
                  <label className="checkbox-option ghost-toggle">
                    <input
                      type="checkbox"
                      checked={showGhostFrame}
                      onChange={(e) => setShowGhostFrame(e.target.checked)}
                    />
                    {t("editor.toolbar.ghostFrameToggle")}
                  </label>
                )}

                <div className="menu-divider" />

                <span className="menu-section-label">{t("editor.frames.title")}</span>
                <FrameActionsMenu />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
