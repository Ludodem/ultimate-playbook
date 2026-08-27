import type { Frame } from "./models";

/** Voir docs/DATA_MODEL.md §9 et docs/ARCHITECTURE.md §7. */

/** Nombre de couleurs distinctes avant que la palette ne boucle (`--branch-0..3`
 * dans `src/index.css`) — un embranchement a rarement plus de 2-3 options en
 * pratique. Partagé par la barre Frames (`FrameTimeline.tsx`) et le panneau
 * arbre complet (`FrameTreePanel.tsx`) pour qu'une même branche ait toujours
 * la même couleur, quelle que soit la vue. */
export const BRANCH_COLOR_COUNT = 4;

/** L'unique frame avec parentId === null. */
export function getRootFrame(frames: Frame[]): Frame | undefined {
  return frames.find((f) => f.parentId === null);
}

export function getFrame(frames: Frame[], id: string): Frame | undefined {
  return frames.find((f) => f.id === id);
}

/** Enfants directs d'une frame, triés par siblingOrder. */
export function getChildren(frames: Frame[], parentId: string): Frame[] {
  return frames
    .filter((f) => f.parentId === parentId)
    .sort((a, b) => a.siblingOrder - b.siblingOrder);
}

/** Un embranchement = une frame avec plus d'un enfant. */
export function isForkFrame(frames: Frame[], frameId: string): boolean {
  return getChildren(frames, frameId).length > 1;
}

/** Une frame et tous ses descendants (elle incluse), utile pour une suppression en cascade. */
export function getSubtreeIds(frames: Frame[], rootId: string): string[] {
  const ids = [rootId];
  for (const child of getChildren(frames, rootId)) {
    ids.push(...getSubtreeIds(frames, child.id));
  }
  return ids;
}

/** Une frame de la barre Frames. */
export interface FrameSegment {
  kind: "frame";
  frame: Frame;
}

/**
 * Une branche rencontrée sur le chemin, où qu'elle soit (avant, à, ou après
 * la frame courante) — voir docs/PRD.md §4.8 et le retour utilisateur qui a
 * motivé ce type ("on ne comprend pas où sont les branches, sur laquelle on
 * est"). `options` liste tous les enfants de la frame qui bifurque à cet
 * endroit (peut n'en contenir qu'un seul : dès qu'une branche est créée, elle
 * doit apparaître ici, même avant qu'une deuxième option n'existe — sinon
 * créer la toute première branche ne produit aucun retour visuel). `activeId`
 * est l'option sur le chemin déjà empruntée (`null` si la frame courante est
 * elle-même l'embranchement et qu'aucune option n'a encore été choisie).
 */
export interface BranchSegment {
  kind: "branch";
  options: Frame[];
  activeId: string | null;
}

export type PathSegment = FrameSegment | BranchSegment;

export interface CurrentPathView {
  segments: PathSegment[];
}

/**
 * Vue compacte "où en est-on dans l'arbre" pour la barre Frames (voir
 * docs/PRD.md §4.8) : pas tout l'arbre, seulement le chemin qui passe par la
 * frame courante, étendu au maximum sans ambiguïté dans les deux sens, avec
 * un segment "branch" à chaque branche traversée (choisie ou non). Naviguer
 * vers une branche déjà explorée mais absente de ce chemin se fait en deux
 * temps (remonter jusqu'à son embranchement, puis la choisir) plutôt qu'en un
 * raccourci direct — compromis délibéré pour garder cette barre toujours
 * visible sans jamais afficher tout l'arbre.
 */
export function computeCurrentPathView(
  frames: Frame[],
  currentFrameId: string | null,
): CurrentPathView {
  const current = currentFrameId ? getFrame(frames, currentFrameId) : undefined;
  if (!current) return { segments: [] };

  const ancestors: Frame[] = [];
  let cursor = current;
  while (cursor.parentId !== null) {
    const parent = getFrame(frames, cursor.parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    cursor = parent;
  }

  const descendants: Frame[] = [];
  let tail = current;
  for (;;) {
    const children = getChildren(frames, tail.id);
    if (children.length !== 1) break;
    descendants.push(children[0]);
    tail = children[0];
  }

  const chain = [...ancestors, current, ...descendants];
  const segments: PathSegment[] = [];
  for (let i = 0; i < chain.length; i++) {
    // Une frame avec un `branchLabel` est une branche dès sa création, que sa
    // frame parente ait déjà une deuxième option ou non (voir `BranchSegment`).
    if (i > 0 && chain[i].branchLabel !== undefined) {
      const siblings = getChildren(frames, chain[i - 1].id);
      segments.push({ kind: "branch", options: siblings, activeId: chain[i].id });
    }
    segments.push({ kind: "frame", frame: chain[i] });
  }

  const tailChildren = getChildren(frames, tail.id);
  if (tailChildren.length > 1) {
    segments.push({ kind: "branch", options: tailChildren, activeId: null });
  }

  return { segments };
}

/** Une ligne de la vue "arbre complet" (`FrameTreePanel.tsx`), à plat pour un
 * rendu en liste indentée façon explorateur de fichiers. */
export interface TreeRow {
  frame: Frame;
  /** Niveau d'indentation visuelle : n'augmente qu'à un embranchement (une
   * longue chaîne sans branche reste au même niveau, quelle que soit sa
   * longueur) — contrairement à `generation`, qui compte chaque frame. */
  visualDepth: number;
  /** Position depuis la racine en nombre de frames (racine = 1), le long du
   * chemin propre à cette frame — correspond à la numérotation affichée dans
   * la barre Frames (`computeCurrentPathView`) pour la frame courante. */
  generation: number;
  /** Couleur héritée du dernier embranchement remonté (`null` avant le
   * premier), même convention que `computeCurrentPathView` (index de
   * l'option parmi les enfants du fork, modulo `BRANCH_COLOR_COUNT`). */
  branchColorIndex: number | null;
}

/**
 * Vue "arbre complet" pour le panneau latéral sur grand écran (voir
 * docs/PRD.md §4.8bis) : toutes les frames de l'arbre, à plat en ordre
 * préfixe (parcours en profondeur), avec assez d'information pour un rendu
 * indenté et coloré par branche. Contrairement à `computeCurrentPathView`
 * (compacte, un seul chemin), montre tout — pertinent uniquement quand la
 * place ne manque pas.
 */
export function computeFullTreeRows(frames: Frame[]): TreeRow[] {
  const root = getRootFrame(frames);
  if (!root) return [];

  const rows: TreeRow[] = [];
  const visit = (
    frame: Frame,
    visualDepth: number,
    generation: number,
    branchColorIndex: number | null,
  ) => {
    rows.push({ frame, visualDepth, generation, branchColorIndex });
    const children = getChildren(frames, frame.id);
    children.forEach((child, index) => {
      // Un enfant avec un `branchLabel` est une branche dès sa création, même
      // seule pour l'instant (pas seulement à partir de 2 options) — même
      // convention que `computeCurrentPathView` (voir sa note sur le retour
      // utilisateur "aucun feedback à la création de la première branche").
      const isBranch = child.branchLabel !== undefined;
      visit(
        child,
        isBranch ? visualDepth + 1 : visualDepth,
        generation + 1,
        isBranch ? index % BRANCH_COLOR_COUNT : branchColorIndex,
      );
    });
  };
  visit(root, 0, 1, null);

  return rows;
}

/**
 * Résout un chemin complet de la racine à une feuille (ou au premier
 * embranchement sans choix fourni), en suivant `choices` (clé = id de la
 * frame-embranchement, valeur = id de l'enfant choisi) à chaque fork.
 */
export function resolvePath(frames: Frame[], choices: Record<string, string> = {}): Frame[] {
  const root = getRootFrame(frames);
  if (!root) return [];

  const path: Frame[] = [root];
  let current = root;
  for (;;) {
    const children = getChildren(frames, current.id);
    if (children.length === 0) break;
    const next =
      children.length === 1 ? children[0] : children.find((c) => c.id === choices[current.id]);
    if (!next) break;
    path.push(next);
    current = next;
  }
  return path;
}
