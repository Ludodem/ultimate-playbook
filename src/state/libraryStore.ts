// Persistance locale des actions — voir docs/DATA_MODEL.md §6 (Phase 7,
// docs/ROADMAP.md). Pas de state React ici : simples fonctions autour de
// `localStorage`, aucun composant ne doit y accéder directement.
import type { Action } from "../domain/models";

const LIBRARY_KEY = "ultimate-playbook:actions";

type Library = Record<string, Action>;

function readLibrary(): Library {
  const raw = localStorage.getItem(LIBRARY_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Library) : {};
  } catch {
    return {};
  }
}

function writeLibrary(library: Library): void {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
}

export function saveActionToLibrary(action: Action): void {
  const library = readLibrary();
  library[action.id] = action;
  writeLibrary(library);
}

export function loadActionFromLibrary(id: string): Action | undefined {
  return readLibrary()[id];
}

export function deleteActionFromLibrary(id: string): void {
  const library = readLibrary();
  delete library[id];
  writeLibrary(library);
}

export function listActionsFromLibrary(): Action[] {
  return Object.values(readLibrary());
}
