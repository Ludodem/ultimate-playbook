// Regroupement hiérarchique des actions de la bibliothèque par
// category/system/variant — voir docs/PRD.md §4.10. Texte libre à chaque
// niveau (pas un enum fermé) ; absent = panier "Non classé" (clé "") à ce
// niveau, qui se comporte comme n'importe quelle autre valeur pour le
// regroupement (juste triée en dernier, voir `buildLevel`).
import type { Action } from "./models";

type LibraryField = "category" | "system" | "variant";
const LEVELS: LibraryField[] = ["category", "system", "variant"];

export interface LibraryGroup {
  /** Valeur du champ à ce niveau, "" pour le panier "Non classé". */
  key: string;
  /** Actions qui s'arrêtent exactement à ce niveau (rien de plus profond renseigné). */
  actions: Action[];
  /** Sous-groupes pour le niveau suivant ; toujours vide au niveau "variant". */
  children: LibraryGroup[];
}

function fieldValue(action: Action, field: LibraryField): string {
  return (action[field] ?? "").trim();
}

function buildGroup(
  key: string,
  actions: Action[],
  nextField: LibraryField | undefined,
): LibraryGroup {
  if (!nextField) {
    return { key, actions, children: [] };
  }
  const direct = actions.filter((a) => !fieldValue(a, nextField));
  const deeper = actions.filter((a) => fieldValue(a, nextField));
  return {
    key,
    actions: direct,
    children: deeper.length > 0 ? buildLevel(deeper, nextField) : [],
  };
}

function buildLevel(actions: Action[], field: LibraryField): LibraryGroup[] {
  const grouped = new Map<string, Action[]>();
  for (const action of actions) {
    const key = fieldValue(action, field);
    const list = grouped.get(key) ?? [];
    list.push(action);
    grouped.set(key, list);
  }

  const nextField = LEVELS[LEVELS.indexOf(field) + 1];
  const groups: LibraryGroup[] = [];
  for (const [key, groupActions] of grouped) {
    if (key === "") continue; // panier "Non classé" ajouté en dernier ci-dessous
    groups.push(buildGroup(key, groupActions, nextField));
  }
  groups.sort((a, b) => a.key.localeCompare(b.key));

  const unclassified = grouped.get("");
  if (unclassified) {
    groups.push(buildGroup("", unclassified, nextField));
  }
  return groups;
}

/** Arbre de navigation complet de la bibliothèque (niveau "category" à la racine). */
export function computeLibraryTree(actions: Action[]): LibraryGroup[] {
  return buildLevel(actions, "category");
}

/** Nombre total d'actions dans un groupe, lui-même et ses sous-groupes inclus. */
export function countGroupActions(group: LibraryGroup): number {
  return group.actions.length + group.children.reduce((sum, c) => sum + countGroupActions(c), 0);
}

/** Valeurs déjà utilisées pour un champ donné, triées — sert de suggestions
 * (`<datalist>`) plutôt que d'imposer une liste fermée. */
export function collectDistinctValues(actions: Action[], field: LibraryField): string[] {
  const values = new Set<string>();
  for (const action of actions) {
    const value = fieldValue(action, field);
    if (value) values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}
