import { create } from "zustand";
import { resolveDiscPosition } from "../domain/disc";
import type { Disc, Entity, FieldConfig, Frame, Team } from "../domain/models";

/** Voir docs/DATA_MODEL.md §2 : seuil recommandé, pas une limite technique. */
export const MAX_RECOMMENDED_PER_TEAM = 15;

interface ActionEditorState {
  fieldConfig: FieldConfig | null;
  frame: Frame | null;
  selectedEntityId: string | null;
  /** Piles d'annulation/rétablissement — snapshots de `frame` (Phase 3 : une seule frame). */
  past: Frame[];
  future: Frame[];

  /** Démarre une nouvelle action à partir d'un preset terrain + effectif. */
  start: (fieldConfig: FieldConfig, initial: { entities: Entity[]; disc: Disc }) => void;
  selectEntity: (id: string | null) => void;
  moveEntity: (id: string, x: number, y: number) => void;
  moveDisc: (x: number, y: number) => void;
  addEntity: (team: Team) => void;
  removeEntity: (id: string) => void;
  /** Donne le disque à cette entité (et le retire à toute autre). */
  assignDiscTo: (id: string) => void;
  /** Détache le disque de son porteur, en le figeant à sa position actuelle. */
  freeDisc: () => void;
  undo: () => void;
  redo: () => void;
}

function nextLabel(entities: Entity[], team: Team): string {
  return String(entities.filter((e) => e.team === team).length + 1);
}

/** Applique `updater` à la frame courante en poussant l'état précédent dans l'historique. */
function withHistory(
  state: ActionEditorState,
  updater: (frame: Frame) => Frame,
): Partial<ActionEditorState> {
  if (!state.frame) return {};
  return {
    frame: updater(state.frame),
    past: [...state.past, state.frame],
    future: [],
  };
}

export const useActionEditorStore = create<ActionEditorState>((set) => ({
  fieldConfig: null,
  frame: null,
  selectedEntityId: null,
  past: [],
  future: [],

  start: (fieldConfig, initial) =>
    set({
      fieldConfig,
      frame: { id: crypto.randomUUID(), order: 0, entities: initial.entities, disc: initial.disc },
      selectedEntityId: null,
      past: [],
      future: [],
    }),

  selectEntity: (id) => set({ selectedEntityId: id }),

  moveEntity: (id, x, y) =>
    set((state) =>
      withHistory(state, (frame) => ({
        ...frame,
        entities: frame.entities.map((e) => (e.id === id ? { ...e, x, y } : e)),
      })),
    ),

  moveDisc: (x, y) => set((state) => withHistory(state, (frame) => ({ ...frame, disc: { x, y } }))),

  addEntity: (team) =>
    set((state) => {
      if (!state.frame) return {};
      const newEntity: Entity = {
        id: crypto.randomUUID(),
        team,
        label: nextLabel(state.frame.entities, team),
        x: 50,
        y: 50,
      };
      return withHistory(state, (frame) => ({
        ...frame,
        entities: [...frame.entities, newEntity],
      }));
    }),

  removeEntity: (id) =>
    set((state) => {
      if (!state.frame) return {};
      const wasHolder = state.frame.disc.heldBy === id;
      const patch = withHistory(state, (frame) => {
        const removed = frame.entities.find((e) => e.id === id);
        return {
          ...frame,
          entities: frame.entities.filter((e) => e.id !== id),
          disc: wasHolder && removed ? { x: removed.x, y: removed.y } : frame.disc,
        };
      });
      return {
        ...patch,
        selectedEntityId: state.selectedEntityId === id ? null : state.selectedEntityId,
      };
    }),

  assignDiscTo: (id) =>
    set((state) =>
      withHistory(state, (frame) => ({
        ...frame,
        entities: frame.entities.map((e) => ({ ...e, hasDisc: e.id === id })),
        disc: { heldBy: id },
      })),
    ),

  freeDisc: () =>
    set((state) => {
      if (!state.frame) return {};
      const position = resolveDiscPosition(state.frame.disc, state.frame.entities);
      if (!position) return {};
      return withHistory(state, (frame) => ({
        ...frame,
        entities: frame.entities.map((e) => ({ ...e, hasDisc: false })),
        disc: { x: position.x, y: position.y },
      }));
    }),

  undo: () =>
    set((state) => {
      if (!state.frame || state.past.length === 0) return {};
      const previous = state.past[state.past.length - 1];
      return {
        frame: previous,
        past: state.past.slice(0, -1),
        future: [state.frame, ...state.future],
      };
    }),

  redo: () =>
    set((state) => {
      if (!state.frame || state.future.length === 0) return {};
      const [next, ...rest] = state.future;
      return {
        frame: next,
        past: [...state.past, state.frame],
        future: rest,
      };
    }),
}));
