import { describe, expect, it } from "vitest";
import { buildInterpolatedFrame, interpolatePosition, lerp } from "./interpolation";
import type { Entity, Frame } from "./models";

function entity(id: string, x: number, y: number, extra: Partial<Entity> = {}): Entity {
  return { id, team: "offense", label: id, x, y, ...extra };
}

describe("lerp", () => {
  it("returns a at t=0 and b at t=1", () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it("interpolates linearly in between", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
});

describe("interpolatePosition", () => {
  it("interpolates both axes independently", () => {
    expect(interpolatePosition({ x: 0, y: 100 }, { x: 100, y: 0 }, 0.25)).toEqual({ x: 25, y: 75 });
  });
});

describe("buildInterpolatedFrame", () => {
  const from: Frame = {
    id: "f1",
    parentId: null,
    siblingOrder: 0,
    entities: [entity("a", 0, 0, { hasDisc: true })],
    disc: { heldBy: "a" },
  };
  const to: Frame = {
    id: "f2",
    parentId: "f1",
    siblingOrder: 0,
    entities: [entity("a", 100, 50, { hasDisc: true }), entity("b", 20, 20)],
    disc: { heldBy: "a" },
  };

  it("interpolates a shared entity's position", () => {
    const mid = buildInterpolatedFrame(from, to, 0.5);
    expect(mid.entities.find((e) => e.id === "a")).toMatchObject({ x: 50, y: 25 });
  });

  it("shows an entity absent from the start frame directly at its target position", () => {
    const mid = buildInterpolatedFrame(from, to, 0.1);
    expect(mid.entities.find((e) => e.id === "b")).toMatchObject({ x: 20, y: 20 });
  });

  it("interpolates the disc position (here following its holder)", () => {
    const mid = buildInterpolatedFrame(from, to, 0.5);
    expect(mid.disc).toEqual({ x: 50, y: 25 });
  });

  it("returns the 'to' frame's entities/disc unchanged at t=1", () => {
    const end = buildInterpolatedFrame(from, to, 1);
    expect(end.entities.find((e) => e.id === "a")).toMatchObject({ x: 100, y: 50 });
    expect(end.disc).toEqual({ x: 100, y: 50 });
  });

  it("interpolates a free (unheld) disc between two free positions", () => {
    const freeFrom: Frame = { ...from, disc: { x: 10, y: 10 } };
    const freeTo: Frame = { ...to, disc: { x: 90, y: 90 } };
    const mid = buildInterpolatedFrame(freeFrom, freeTo, 0.5);
    expect(mid.disc).toEqual({ x: 50, y: 50 });
  });

  it("preserves the 'to' frame's other fields (id, branchLabel, note...)", () => {
    const toWithNote: Frame = { ...to, note: "swing" };
    const mid = buildInterpolatedFrame(from, toWithNote, 0.5);
    expect(mid.id).toBe("f2");
    expect(mid.note).toBe("swing");
  });
});
