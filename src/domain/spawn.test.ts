import { describe, expect, it } from "vitest";
import type { Entity } from "./models";
import { findFreeSpawnPosition } from "./spawn";

function entityAt(x: number, y: number): Entity {
  return { id: crypto.randomUUID(), team: "offense", label: "x", x, y };
}

describe("findFreeSpawnPosition", () => {
  it("returns the field center when it is free", () => {
    expect(findFreeSpawnPosition([])).toEqual({ x: 50, y: 50 });
  });

  it("returns a position away from the center when it is occupied", () => {
    const spawn = findFreeSpawnPosition([entityAt(50, 50)]);
    expect(spawn).not.toEqual({ x: 50, y: 50 });
  });

  it("returns a position that keeps a minimum distance from every existing entity", () => {
    const existing = [entityAt(50, 50), entityAt(56, 50), entityAt(44, 50), entityAt(50, 56)];
    const spawn = findFreeSpawnPosition(existing);
    for (const e of existing) {
      expect(Math.hypot(spawn.x - e.x, spawn.y - e.y)).toBeGreaterThanOrEqual(9);
    }
  });

  it("stays within playable field bounds", () => {
    const existing = Array.from({ length: 5 }, (_, i) => entityAt(50 + i, 50));
    const spawn = findFreeSpawnPosition(existing);
    expect(spawn.x).toBeGreaterThanOrEqual(5);
    expect(spawn.x).toBeLessThanOrEqual(95);
    expect(spawn.y).toBeGreaterThanOrEqual(5);
    expect(spawn.y).toBeLessThanOrEqual(95);
  });

  it("falls back to the center when the field is too crowded to find a free spot", () => {
    // Un quadrillage dense qui sature toutes les positions candidates des anneaux.
    const existing: Entity[] = [];
    for (let x = 0; x <= 100; x += 4) {
      for (let y = 0; y <= 100; y += 4) {
        existing.push(entityAt(x, y));
      }
    }
    expect(findFreeSpawnPosition(existing)).toEqual({ x: 50, y: 50 });
  });
});
