import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Field } from "../field";
import { PlaybackView } from "../playback";
import type { Position } from "../../domain/disc";
import { fitFieldStageSize } from "../../domain/geometry";
import { controlPointForMidpoint, curveMidpoint } from "../../domain/interpolation";
import { MAX_RECOMMENDED_PER_TEAM, useActionEditorStore } from "../../state/actionEditorStore";
import { EditorActionsPanel } from "./EditorActionsPanel";
import { FrameTimeline } from "./FrameTimeline";
import { FrameTreePanel } from "./FrameTreePanel";

type ViewMode = "edit" | "play";

/** Largeur minimale à réserver côté terrain une fois le panneau latéral
 * soustrait, en dessous de laquelle on repasse en barre du bas — voir
 * docs/PRD.md §4.8bis. Mesuré plutôt qu'un point de rupture CSS fixe : ce qui
 * compte n'est pas la largeur de l'écran mais l'espace effectivement laissé
 * inutilisé à côté du terrain une fois celui-ci ajusté à l'espace disponible
 * (`fitFieldStageSize`), qui dépend de l'orientation courante et du ratio du
 * terrain, pas seulement du viewport. */
const SIDE_PANEL_MIN_SLACK = 280;

/**
 * Éditeur de positions d'une action en cours (Phases 3-9, docs/ROADMAP.md).
 * Disposition : le terrain occupe tout l'écran en continu, la vue Frames a un
 * espace dédié (jamais posée par-dessus le terrain) — voir docs/PRD.md §4.8.
 * Sur grand écran (assez d'espace mesuré à côté du terrain, `useSidePanel`),
 * le contenu du menu ⋯ (`EditorActionsPanel`) est affiché en permanence dans
 * la colonne latérale plutôt que derrière un bouton à ouvrir — voir
 * docs/PRD.md §4.8quater. Sur écran étroit, il reste replié derrière le
 * bouton ⋯, seule option qui laisse assez de place au terrain.
 */
export function PositionEditor() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [draftMidpoint, setDraftMidpoint] = useState<Position | null>(null);
  const [showGhostFrame, setShowGhostFrame] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const actionId = useActionEditorStore((s) => s.actionId);
  const createdAt = useActionEditorStore((s) => s.createdAt);
  const updatedAt = useActionEditorStore((s) => s.updatedAt);
  const fieldConfig = useActionEditorStore((s) => s.fieldConfig);
  const frames = useActionEditorStore((s) => s.frames);
  const currentFrameId = useActionEditorStore((s) => s.currentFrameId);
  const frame = frames.find((f) => f.id === currentFrameId) ?? null;
  const selectedEntityId = useActionEditorStore((s) => s.selectedEntityId);
  const selectEntity = useActionEditorStore((s) => s.selectEntity);
  const moveEntity = useActionEditorStore((s) => s.moveEntity);
  const moveDisc = useActionEditorStore((s) => s.moveDisc);
  const removeEntity = useActionEditorStore((s) => s.removeEntity);
  const setDiscCurveControlPoint = useActionEditorStore((s) => s.setDiscCurveControlPoint);
  const orientation = useActionEditorStore((s) => s.orientation);

  const editorMainRef = useRef<HTMLDivElement>(null);
  const [useSidePanel, setUseSidePanel] = useState(false);

  // Bascule barre du bas / panneau latéral (docs/PRD.md §4.8bis) : mesure
  // l'espace que le terrain laisserait inutilisé sur le côté une fois ajusté
  // à `.editor-main` (voir `fitFieldStageSize`, qui tient compte de
  // l'orientation courante) plutôt qu'un point de rupture CSS fixe — sur PC
  // large, ce "slack" existe déjà aujourd'hui (le terrain est contraint par
  // la hauteur, pas la largeur) ; sur mobile, il n'existe pas.
  useEffect(() => {
    const el = editorMainRef.current;
    if (!el || !fieldConfig) return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const fitted = fitFieldStageSize(width, height, fieldConfig, orientation);
      setUseSidePanel(width - fitted.width >= SIDE_PANEL_MIN_SLACK);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fieldConfig, orientation]);

  if (!fieldConfig || !frame || !actionId || !createdAt || !updatedAt) return null;

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
        <div className={`editor-main${useSidePanel ? " editor-main-row" : ""}`} ref={editorMainRef}>
          <div className="field-stage">
            <div className="field-demo">
              <Field
                fieldConfig={fieldConfig}
                frame={frame}
                orientation={orientation}
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

          {useSidePanel ? (
            <div className="editor-side-column">
              <div className="editor-side-actions">
                <EditorActionsPanel
                  showGhostFrame={showGhostFrame}
                  onToggleGhostFrame={setShowGhostFrame}
                />
              </div>
              <FrameTreePanel />
            </div>
          ) : (
            <FrameTimeline />
          )}
        </div>
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

      {viewMode === "edit" && !useSidePanel && (
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
                <EditorActionsPanel
                  showGhostFrame={showGhostFrame}
                  onToggleGhostFrame={setShowGhostFrame}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
