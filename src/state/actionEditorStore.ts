import { create } from "zustand";
import { buildAction } from "../domain/action";
import type { FieldOrientation } from "../domain/geometry";
import type {
  Action,
  CurveControlPoint,
  Disc,
  Entity,
  FieldConfig,
  Frame,
  Team,
} from "../domain/models";
import { DEFAULT_TRANSITION_MS } from "../domain/playback";
import { findFreeSpawnPosition } from "../domain/spawn";
import { getChildren, getSubtreeIds } from "../domain/tree";
import { saveActionToLibrary, setLastActiveActionId } from "./libraryStore";

/** Voir docs/DATA_MODEL.md §2 : seuil recommandé, pas une limite technique. */
export const MAX_RECOMMENDED_PER_TEAM = 15;

/** Nom par défaut donné à une continuation existante quand elle devient une
 * branche parmi d'autres (voir docs/DATA_MODEL.md §9) ; l'utilisateur peut la
 * renommer ensuite via `renameBranch`. */
const DEFAULT_FIRST_BRANCH_LABEL = "Option 1";

interface HistoryEntry {
  frames: Frame[];
  currentFrameId: string | null;
}

interface ActionEditorState {
  /** Métadonnées de l'`Action` en cours (voir docs/DATA_MODEL.md) — `null`/vides
   * tant qu'aucune action n'est démarrée (écran de configuration affiché). */
  actionId: string | null;
  actionName: string;
  tags: string[];
  defaultTransitionMs: number;
  createdAt: string | null;
  updatedAt: string | null;
  fieldConfig: FieldConfig | null;
  frames: Frame[];
  currentFrameId: string | null;
  selectedEntityId: string | null;
  /** Piles d'annulation/rétablissement — snapshots de (frames, currentFrameId). */
  past: HistoryEntry[];
  future: HistoryEntry[];
  /** Préférence d'affichage pure, jamais persistée : repart toujours à
   * "portrait" au rechargement de la page (choix produit explicite, voir
   * docs/PRD.md §4.8bis) — absente du modèle `Action` et exclue de la
   * sauvegarde automatique ci-dessous. */
  orientation: FieldOrientation;
  setOrientation: (orientation: FieldOrientation) => void;

  /** Démarre une nouvelle action : crée la frame racine à partir d'un preset terrain + effectif. */
  start: (
    fieldConfig: FieldConfig,
    initial: { entities: Entity[]; disc: Disc },
    name: string,
  ) => void;
  setActionName: (name: string) => void;
  /** Charge une action existante (reprise au démarrage, ou import JSON). */
  loadAction: (action: Action) => void;
  /** Abandonne l'action en cours, revient à l'écran de configuration. */
  resetToSetup: () => void;
  selectFrame: (id: string) => void;
  selectEntity: (id: string | null) => void;
  moveEntity: (id: string, x: number, y: number) => void;
  moveDisc: (x: number, y: number) => void;
  addEntity: (team: Team) => void;
  removeEntity: (id: string) => void;
  setNote: (note: string) => void;
  /** Définit (ou, avec `null`, réinitialise) le point de contrôle de la courbe
   * du disque arrivant sur la frame courante — voir docs/DATA_MODEL.md §8. */
  setDiscCurveControlPoint: (point: CurveControlPoint | null) => void;
  /** Duplique la frame courante comme continuation simple ; no-op si elle a déjà un enfant. */
  addNextFrame: () => void;
  /** Crée une nouvelle branche depuis la frame courante ; labellise rétroactivement
   * son éventuel enfant unique existant. */
  addBranch: (branchLabel: string) => void;
  renameBranch: (frameId: string, label: string) => void;
  /** Supprime une frame et tous ses descendants ; no-op sur la racine. */
  deleteFrame: (id: string) => void;
  /** Échange une frame avec son parent (no-op si racine ou si le parent est un embranchement). */
  moveFrameUp: (id: string) => void;
  /** Échange une frame avec son unique enfant (no-op si 0 ou plusieurs enfants). */
  moveFrameDown: (id: string) => void;
  undo: () => void;
  redo: () => void;
}

function nextLabel(entities: Entity[], team: Team): string {
  return String(entities.filter((e) => e.team === team).length + 1);
}

function cloneFrameContent(source: Frame): Pick<Frame, "entities" | "disc"> {
  return {
    entities: source.entities.map((e) => ({ ...e })),
    disc: { ...source.disc },
  };
}

/** Applique `updater` à `frames` en poussant l'état précédent (frames + frame courante) dans l'historique. */
function withHistory(
  state: ActionEditorState,
  updater: (frames: Frame[]) => Frame[],
): Pick<ActionEditorState, "frames" | "past" | "future" | "updatedAt"> {
  return {
    frames: updater(state.frames),
    past: [...state.past, { frames: state.frames, currentFrameId: state.currentFrameId }],
    future: [],
    updatedAt: new Date().toISOString(),
  };
}

/** Applique `updater` à la frame actuellement affichée, avec historique. */
function updateCurrentFrame(
  state: ActionEditorState,
  updater: (frame: Frame) => Frame,
): Partial<ActionEditorState> {
  if (!state.currentFrameId) return {};
  return withHistory(state, (frames) =>
    frames.map((f) => (f.id === state.currentFrameId ? updater(f) : f)),
  );
}

/** Échange une frame avec son unique enfant `childId` (implémente move up/down). */
function swapWithChild(frames: Frame[], parent: Frame, child: Frame): Frame[] {
  return frames.map((f) => {
    if (f.id === child.id) {
      return {
        ...f,
        parentId: parent.parentId,
        siblingOrder: parent.siblingOrder,
        branchLabel: parent.branchLabel,
      };
    }
    if (f.id === parent.id) {
      return { ...f, parentId: child.id, siblingOrder: 0, branchLabel: undefined };
    }
    return f;
  });
}

export const useActionEditorStore = create<ActionEditorState>((set, get) => ({
  actionId: null,
  actionName: "",
  tags: [],
  defaultTransitionMs: DEFAULT_TRANSITION_MS,
  createdAt: null,
  updatedAt: null,
  fieldConfig: null,
  frames: [],
  currentFrameId: null,
  selectedEntityId: null,
  past: [],
  future: [],
  orientation: "portrait",
  setOrientation: (orientation) => set({ orientation }),

  start: (fieldConfig, initial, name) => {
    const rootId = crypto.randomUUID();
    const rootFrame: Frame = {
      id: rootId,
      parentId: null,
      siblingOrder: 0,
      entities: initial.entities,
      disc: initial.disc,
    };
    const now = new Date().toISOString();
    set({
      actionId: crypto.randomUUID(),
      actionName: name,
      tags: [],
      defaultTransitionMs: DEFAULT_TRANSITION_MS,
      createdAt: now,
      updatedAt: now,
      fieldConfig,
      frames: [rootFrame],
      currentFrameId: rootId,
      selectedEntityId: null,
      past: [],
      future: [],
    });
  },

  setActionName: (name) => set({ actionName: name, updatedAt: new Date().toISOString() }),

  loadAction: (action) => {
    const root = action.frames.find((f) => f.parentId === null) ?? null;
    set({
      actionId: action.id,
      actionName: action.name,
      tags: action.tags,
      defaultTransitionMs: action.defaultTransitionMs,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
      fieldConfig: action.fieldConfig,
      frames: action.frames,
      currentFrameId: root?.id ?? null,
      selectedEntityId: null,
      past: [],
      future: [],
    });
  },

  resetToSetup: () => {
    setLastActiveActionId(null);
    set({
      actionId: null,
      actionName: "",
      tags: [],
      defaultTransitionMs: DEFAULT_TRANSITION_MS,
      createdAt: null,
      updatedAt: null,
      fieldConfig: null,
      frames: [],
      currentFrameId: null,
      selectedEntityId: null,
      past: [],
      future: [],
    });
  },

  selectFrame: (id) => set({ currentFrameId: id, selectedEntityId: null }),

  selectEntity: (id) => set({ selectedEntityId: id }),

  moveEntity: (id, x, y) =>
    set((state) =>
      updateCurrentFrame(state, (frame) => ({
        ...frame,
        entities: frame.entities.map((e) => (e.id === id ? { ...e, x, y } : e)),
      })),
    ),

  moveDisc: (x, y) =>
    set((state) => updateCurrentFrame(state, (frame) => ({ ...frame, disc: { x, y } }))),

  addEntity: (team) =>
    set((state) => {
      const current = state.frames.find((f) => f.id === state.currentFrameId);
      if (!current) return {};
      const spawn = findFreeSpawnPosition(current.entities);
      const newEntity: Entity = {
        id: crypto.randomUUID(),
        team,
        label: nextLabel(current.entities, team),
        x: spawn.x,
        y: spawn.y,
      };
      return updateCurrentFrame(state, (frame) => ({
        ...frame,
        entities: [...frame.entities, newEntity],
      }));
    }),

  removeEntity: (id) =>
    set((state) => {
      if (!state.currentFrameId) return {};
      const patch = updateCurrentFrame(state, (frame) => ({
        ...frame,
        entities: frame.entities.filter((e) => e.id !== id),
      }));
      return {
        ...patch,
        selectedEntityId: state.selectedEntityId === id ? null : state.selectedEntityId,
      };
    }),

  setNote: (note) => set((state) => updateCurrentFrame(state, (frame) => ({ ...frame, note }))),

  setDiscCurveControlPoint: (point) =>
    set((state) =>
      updateCurrentFrame(state, (frame) => {
        const nextCurves = { ...frame.incomingCurves };
        if (point) {
          nextCurves.disc = point;
        } else {
          delete nextCurves.disc;
        }
        const hasCurves = Object.keys(nextCurves).length > 0;
        return { ...frame, incomingCurves: hasCurves ? nextCurves : undefined };
      }),
    ),

  addNextFrame: () =>
    set((state) => {
      if (!state.currentFrameId) return {};
      // Seule la dernière frame d'une branche peut être prolongée ainsi ; sinon
      // il faut passer par addBranch (voir docs/ARCHITECTURE.md §7).
      if (getChildren(state.frames, state.currentFrameId).length > 0) return {};
      const current = state.frames.find((f) => f.id === state.currentFrameId);
      if (!current) return {};
      const clone: Frame = {
        id: crypto.randomUUID(),
        parentId: current.id,
        siblingOrder: 0,
        ...cloneFrameContent(current),
      };
      return {
        ...withHistory(state, (frames) => [...frames, clone]),
        currentFrameId: clone.id,
        selectedEntityId: null,
      };
    }),

  addBranch: (branchLabel) =>
    set((state) => {
      if (!state.currentFrameId) return {};
      const current = state.frames.find((f) => f.id === state.currentFrameId);
      if (!current) return {};
      const existingChildren = getChildren(state.frames, current.id);
      const newChild: Frame = {
        id: crypto.randomUUID(),
        parentId: current.id,
        siblingOrder: existingChildren.length,
        branchLabel,
        ...cloneFrameContent(current),
      };
      // Si le parent n'avait qu'un seul enfant jusque-là, il faut le labelliser
      // rétroactivement : un parent à plusieurs enfants exige un branchLabel sur chacun.
      const needsRetroactiveLabel =
        existingChildren.length === 1 && !existingChildren[0].branchLabel;
      const retroactiveId = needsRetroactiveLabel ? existingChildren[0].id : null;
      return {
        ...withHistory(state, (frames) => [
          ...frames.map((f) =>
            f.id === retroactiveId ? { ...f, branchLabel: DEFAULT_FIRST_BRANCH_LABEL } : f,
          ),
          newChild,
        ]),
        currentFrameId: newChild.id,
        selectedEntityId: null,
      };
    }),

  renameBranch: (frameId, label) =>
    set((state) =>
      withHistory(state, (frames) =>
        frames.map((f) => (f.id === frameId ? { ...f, branchLabel: label } : f)),
      ),
    ),

  deleteFrame: (id) =>
    set((state) => {
      const target = state.frames.find((f) => f.id === id);
      if (!target || target.parentId === null) return {}; // frame racine non supprimable
      const toRemove = new Set(getSubtreeIds(state.frames, id));
      const fallbackFrameId = target.parentId;
      const currentWasRemoved = state.currentFrameId !== null && toRemove.has(state.currentFrameId);
      return {
        ...withHistory(state, (frames) => frames.filter((f) => !toRemove.has(f.id))),
        currentFrameId: currentWasRemoved ? fallbackFrameId : state.currentFrameId,
        selectedEntityId: null,
      };
    }),

  moveFrameUp: (id) =>
    set((state) => {
      const frame = state.frames.find((f) => f.id === id);
      if (!frame || frame.parentId === null) return {};
      const parent = state.frames.find((f) => f.id === frame.parentId);
      if (!parent) return {};
      // Réordonnancement limité aux chaînes simples : si le parent est lui-même
      // un embranchement, l'échanger avec un seul de ses enfants n'a pas de sens.
      if (getChildren(state.frames, parent.id).length > 1) return {};
      return withHistory(state, (frames) => swapWithChild(frames, parent, frame));
    }),

  moveFrameDown: (id) => {
    const children = getChildren(get().frames, id);
    if (children.length !== 1) return;
    get().moveFrameUp(children[0].id);
  },

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return {};
      const previous = state.past[state.past.length - 1];
      return {
        frames: previous.frames,
        currentFrameId: previous.currentFrameId,
        past: state.past.slice(0, -1),
        future: [{ frames: state.frames, currentFrameId: state.currentFrameId }, ...state.future],
        selectedEntityId: null,
        updatedAt: new Date().toISOString(),
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return {};
      const [next, ...rest] = state.future;
      return {
        frames: next.frames,
        currentFrameId: next.currentFrameId,
        past: [...state.past, { frames: state.frames, currentFrameId: state.currentFrameId }],
        future: rest,
        selectedEntityId: null,
        updatedAt: new Date().toISOString(),
      };
    }),
}));

// Sauvegarde automatique (Phase 7, docs/ROADMAP.md) : toute action qui modifie
// le contenu persistable (frames, config terrain, nom, tags, timing) réécrit
// l'action dans le localStorage, sans bouton "Enregistrer" dédié. `currentFrameId`
// et `selectedEntityId` sont un état d'édition pur, absent du modèle `Action` —
// naviguer entre frames ne déclenche donc pas de sauvegarde.
useActionEditorStore.subscribe((state, prevState) => {
  if (!state.actionId || !state.fieldConfig || !state.createdAt || !state.updatedAt) return;
  if (
    state.frames === prevState.frames &&
    state.fieldConfig === prevState.fieldConfig &&
    state.actionName === prevState.actionName &&
    state.tags === prevState.tags &&
    state.defaultTransitionMs === prevState.defaultTransitionMs
  ) {
    return;
  }
  saveActionToLibrary(
    buildAction({
      id: state.actionId,
      name: state.actionName,
      tags: state.tags,
      fieldConfig: state.fieldConfig,
      defaultTransitionMs: state.defaultTransitionMs,
      frames: state.frames,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
    }),
  );
  setLastActiveActionId(state.actionId);
});
