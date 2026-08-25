import { describe, expect, it } from "vitest";
import type { Entity } from "../models";
import {
  emptyPreset,
  fiveVFiveHorizontalStackPreset,
  fiveVFiveVerticalStackPreset,
  type RosterPreset,
} from "./roster";

function expectValidCoordinates(entities: Entity[]) {
  for (const e of entities) {
    expect(e.x).toBeGreaterThanOrEqual(0);
    expect(e.x).toBeLessThanOrEqual(100);
    expect(e.y).toBeGreaterThanOrEqual(0);
    expect(e.y).toBeLessThanOrEqual(100);
  }
}

describe("emptyPreset", () => {
  it("has no players and a disc placed at the field's center", () => {
    const preset = emptyPreset();
    expect(preset.entities).toHaveLength(0);
    expect(preset.disc).toEqual({ x: 50, y: 50 });
  });
});

describe.each<[string, () => RosterPreset]>([
  ["vertical stack", fiveVFiveVerticalStackPreset],
  ["horizontal stack", fiveVFiveHorizontalStackPreset],
])("5v5 %s preset", (_label, buildPreset) => {
  it("has 5 offense, 5 defense, valid coordinates and the disc placed on H1", () => {
    const { entities, disc } = buildPreset();

    expect(entities.filter((e) => e.team === "offense")).toHaveLength(5);
    expect(entities.filter((e) => e.team === "defense")).toHaveLength(5);
    expectValidCoordinates(entities);

    const h1 = entities.find((e) => e.label === "H1")!;
    expect(disc).toEqual({ x: h1.x, y: h1.y });
  });

  it("marks each handler (H1/H2) with a defender positioned in front of them, not just beside them", () => {
    const { entities } = buildPreset();
    const h1 = entities.find((e) => e.label === "H1")!;
    const h2 = entities.find((e) => e.label === "H2")!;
    const d1 = entities.find((e) => e.label === "D1")!;
    const d2 = entities.find((e) => e.label === "D2")!;

    // "Devant" = plus proche de la direction d'attaque (y=0) que le handler marqué.
    expect(d1.y).toBeLessThan(h1.y);
    expect(d2.y).toBeLessThan(h2.y);
  });

  it("gives every entity a unique id and label", () => {
    const { entities } = buildPreset();
    expect(new Set(entities.map((e) => e.id)).size).toBe(entities.length);
    expect(new Set(entities.map((e) => e.label)).size).toBe(entities.length);
  });
});
