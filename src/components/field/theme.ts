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
