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
  it("has 5 offense, 5 defense, valid coordinates and exactly one disc holder", () => {
    const { entities, disc } = buildPreset();

    expect(entities.filter((e) => e.team === "offense")).toHaveLength(5);
    expect(entities.filter((e) => e.team === "defense")).toHaveLength(5);
    expectValidCoordinates(entities);

    const holders = entities.filter((e) => e.hasDisc);
    expect(holders).toHaveLength(1);
    expect(disc.heldBy).toBe(holders[0].id);
    expect(disc.x).toBe(holders[0].x);
    expect(disc.y).toBe(holders[0].y);
  });

  it("gives every entity a unique id and label", () => {
    const { entities } = buildPreset();
    expect(new Set(entities.map((e) => e.id)).size).toBe(entities.length);
    expect(new Set(entities.map((e) => e.label)).size).toBe(entities.length);
  });
});
