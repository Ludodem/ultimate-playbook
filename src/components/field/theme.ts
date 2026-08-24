import type { Team } from "../../domain/models";

// Couleurs des entités et du disque : convention visuelle de l'app, pas une
// donnée de l'Action (contrairement aux couleurs de terrain, cf. docs/DATA_MODEL.md
// et src/domain/presets/fieldColors.ts). Choisies pour bien ressortir à la fois
// sur le gris du terrain et le bleu de l'en-but, et rester distinguables entre
// elles sans utiliser le bleu (déjà pris par l'en-but) ni le duo rouge/vert
// (mauvaise distinction pour le daltonisme).
export const ENTITY_COLORS: Record<Team, string> = {
  offense: "#D9622B", // orange
  defense: "#5B3E99", // violet
};

export const ENTITY_LABEL_COLOR = "#FFFFFF";

export const DISC_FILL_COLOR = "#F5F0E6"; // crème, évoque un vrai disque
export const DISC_STROKE_COLOR = "#4B4F58"; // même gris ardoise que les lignes du terrain

/** Contour d'une entité sélectionnée en mode édition (Phase 3). Jaune, ne rentre
 * en conflit avec aucune autre couleur du thème (orange/violet/gris/bleu/crème). */
export const SELECTION_STROKE_COLOR = "#F2C94C";

/** Flèches de trajectoire en mode lecture pas à pas (Phase 5) : neutre pour une
 * course de joueur (même gris que les lignes), doré + pointillés pour une passe
 * de disque — distinction visuelle demandée par docs/PRD.md §4.4. */
export const PLAYER_ARROW_COLOR = "#4B4F58";
export const DISC_ARROW_COLOR = "#B8860B";
