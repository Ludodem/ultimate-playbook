// Registre persistant des valeurs "système"/"variante" déjà utilisées un jour
// (Phase 10, docs/PRD.md §4.10) — voir docs/ARCHITECTURE.md §8 : retour
// utilisateur direct, une valeur retirée d'une action ne doit pas disparaître
// des suggestions futures. Volontairement séparé de la bibliothèque
// d'actions elle-même (`libraryStore.ts`) : ce registre ne reflète pas ce qui
// est utilisé maintenant, seulement ce qui a déjà existé.
export type TagField = "system" | "variant";

const KEYS: Record<TagField, string> = {
  system: "ultimate-playbook:tags:system",
  variant: "ultimate-playbook:tags:variant",
};

function readTags(field: TagField): string[] {
  const raw = localStorage.getItem(KEYS[field]);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeTags(field: TagField, tags: string[]): void {
  localStorage.setItem(KEYS[field], JSON.stringify(tags));
}

export function listKnownTags(field: TagField): string[] {
  return readTags(field).sort((a, b) => a.localeCompare(b));
}

/** Enregistre une valeur pour de bon, quoi qu'il arrive ensuite à l'action qui l'a utilisée. */
export function registerTag(field: TagField, value: string): void {
  const trimmed = value.trim();
  if (!trimmed) return;
  const tags = readTags(field);
  if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
  writeTags(field, [...tags, trimmed]);
}

/** Retire une valeur des suggestions futures (n'affecte pas les actions qui l'utilisent déjà). */
export function removeKnownTag(field: TagField, value: string): void {
  writeTags(
    field,
    readTags(field).filter((t) => t.toLowerCase() !== value.toLowerCase()),
  );
}
