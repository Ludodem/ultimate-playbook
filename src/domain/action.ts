// Assemblage et validation d'objets `Action` complets — utilisé par la
// persistance locale et l'export/import JSON (Phase 7, docs/ROADMAP.md).
import type { Action, CurveControlPoint, Disc, Entity, FieldConfig, Frame, Team } from "./models";

/** Construit un `Action` complet à partir de l'état courant de l'éditeur. */
export function buildAction(params: {
  id: string;
  name: string;
  tags: string[];
  fieldConfig: FieldConfig;
  defaultTransitionMs: number;
  frames: Frame[];
  createdAt: string;
  updatedAt: string;
}): Action {
  return {
    id: params.id,
    schemaVersion: 1,
    name: params.name,
    tags: params.tags,
    fieldConfig: params.fieldConfig,
    defaultTransitionMs: params.defaultTransitionMs,
    frames: params.frames,
    createdAt: params.createdAt,
    updatedAt: params.updatedAt,
  };
}

/** Nom de fichier sûr dérivé du nom de l'action, pour l'export JSON. */
export function actionFileName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "action"}.json`;
}

export type ActionValidationResult = { ok: true; action: Action } | { ok: false; error: string };

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function invalid(message: string): { ok: false; error: string } {
  return { ok: false, error: message };
}

function validateFieldConfig(v: unknown): v is FieldConfig {
  if (!isObject(v)) return false;
  if (v.type !== "half" && v.type !== "full" && v.type !== "undefined") return false;
  if (!isFiniteNumber(v.lengthMeters) || !isFiniteNumber(v.widthMeters)) return false;
  if (v.endzoneMeters !== undefined && !isFiniteNumber(v.endzoneMeters)) return false;
  if (v.sidelineMarginMeters !== undefined && !isFiniteNumber(v.sidelineMarginMeters)) return false;
  if (v.colors !== undefined && !isObject(v.colors)) return false;
  return true;
}

function validateEntity(v: unknown): v is Entity {
  if (!isObject(v)) return false;
  if (!isString(v.id) || !isString(v.label)) return false;
  const team = v.team as Team;
  if (team !== "offense" && team !== "defense") return false;
  if (!isFiniteNumber(v.x) || !isFiniteNumber(v.y)) return false;
  return true;
}

function validateDisc(v: unknown): v is Disc {
  return isObject(v) && isFiniteNumber(v.x) && isFiniteNumber(v.y);
}

function validateCurvePoint(v: unknown): v is CurveControlPoint {
  return isObject(v) && isFiniteNumber(v.x) && isFiniteNumber(v.y);
}

function validateFrame(v: unknown): v is Frame {
  if (!isObject(v)) return false;
  if (!isString(v.id)) return false;
  if (v.parentId !== null && !isString(v.parentId)) return false;
  if (!isFiniteNumber(v.siblingOrder)) return false;
  if (v.branchLabel !== undefined && !isString(v.branchLabel)) return false;
  if (v.note !== undefined && !isString(v.note)) return false;
  if (v.transitionMs !== undefined && !isFiniteNumber(v.transitionMs)) return false;
  if (!Array.isArray(v.entities) || !v.entities.every(validateEntity)) return false;
  if (!validateDisc(v.disc)) return false;
  if (v.incomingCurves !== undefined) {
    if (!isObject(v.incomingCurves)) return false;
    if (!Object.values(v.incomingCurves).every(validateCurvePoint)) return false;
  }
  return true;
}

/**
 * Valide qu'une valeur arbitraire (ex. issue d'un `JSON.parse` sur un fichier
 * importé) constitue bien une `Action` exploitable — voir docs/DATA_MODEL.md §6.
 */
export function validateAction(data: unknown): ActionValidationResult {
  if (!isObject(data)) {
    return invalid("Le fichier ne contient pas un objet JSON valide.");
  }
  if (!isString(data.id)) return invalid('Champ "id" manquant ou invalide.');
  if (data.schemaVersion !== 1) {
    return invalid('Version de schéma non prise en charge ("schemaVersion" doit être 1).');
  }
  if (!isString(data.name)) return invalid('Champ "name" manquant ou invalide.');
  if (!Array.isArray(data.tags) || !data.tags.every(isString)) {
    return invalid('Champ "tags" invalide (doit être une liste de textes).');
  }
  if (!validateFieldConfig(data.fieldConfig)) {
    return invalid('Champ "fieldConfig" manquant ou invalide.');
  }
  if (!isFiniteNumber(data.defaultTransitionMs)) {
    return invalid('Champ "defaultTransitionMs" manquant ou invalide.');
  }
  if (!Array.isArray(data.frames) || data.frames.length === 0) {
    return invalid('Champ "frames" manquant ou vide.');
  }
  if (!data.frames.every(validateFrame)) {
    return invalid("Une ou plusieurs frames sont invalides.");
  }
  const frames = data.frames as Frame[];
  const roots = frames.filter((f) => f.parentId === null);
  if (roots.length !== 1) {
    return invalid("L'action doit contenir exactement une frame racine.");
  }
  if (!isString(data.createdAt) || !isString(data.updatedAt)) {
    return invalid('Champs "createdAt"/"updatedAt" manquants ou invalides.');
  }

  return {
    ok: true,
    action: {
      id: data.id,
      schemaVersion: 1,
      name: data.name,
      tags: data.tags,
      fieldConfig: data.fieldConfig,
      defaultTransitionMs: data.defaultTransitionMs,
      frames,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    },
  };
}
