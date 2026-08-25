import { describe, expect, it } from "vitest";
import {
  buildInterpolatedFrame,
  controlPointForMidpoint,
  curveMidpoint,
  interpolatePosition,
  lerp,
  quadraticBezier,
  sampleQuadraticBezier,
} from "./interpolation";
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

describe("quadraticBezier", () => {
  const p0 = { x: 0, y: 0 };
  const control = { x: 50, y: 100 };
  const p1 = { x: 100, y: 0 };

  it("returns p0 at t=0 and p1 at t=1", () => {
    expect(quadraticBezier(p0, control, p1, 0)).toEqual(p0);
    expect(quadraticBezier(p0, control, p1, 1)).toEqual(p1);
  });

  it("bulges toward the control point at t=0.5, unlike a straight lerp", () => {
    const mid = quadraticBezier(p0, control, p1, 0.5);
    expect(mid).toEqual({ x: 50, y: 50 });
    expect(mid.y).toBeGreaterThan(interpolatePosition(p0, p1, 0.5).y);
  });

  it("is identical to a straight lerp when the control point is the midpoint", () => {
    const midpoint = interpolatePosition(p0, p1, 0.5);
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      expect(quadraticBezier(p0, midpoint, p1, t)).toEqual(interpolatePosition(p0, p1, t));
    }
  });
});

describe("curveMidpoint / controlPointForMidpoint", () => {
  const p0 = { x: 0, y: 0 };
  const p1 = { x: 100, y: 0 };

  it("curveMidpoint only reaches half the control point's excursion from the straight midpoint", () => {
    const control = { x: 50, y: 100 };
    expect(curveMidpoint(p0, control, p1)).toEqual({ x: 50, y: 50 });
  });

  it("controlPointForMidpoint is the exact inverse of curveMidpoint", () => {
    const desiredMidpoint = { x: 60, y: 80 };
    const control = controlPointForMidpoint(p0, p1, desiredMidpoint);
    expect(curveMidpoint(p0, control, p1)).toEqual(desiredMidpoint);
  });

  it("round-trips a midpoint that lies beyond the field (e.g. out of bounds via the sideline margin)", () => {
    const desiredMidpoint = { x: 130, y: 10 };
    const control = controlPointForMidpoint(p0, p1, desiredMidpoint);
    expect(curveMidpoint(p0, control, p1)).toEqual(desiredMidpoint);
  });

  it("returns the straight-line midpoint when the desired midpoint equals it (no curve)", () => {
    const straightMidpoint = interpolatePosition(p0, p1, 0.5);
    const control = controlPointForMidpoint(p0, p1, straightMidpoint);
    expect(control).toEqual(straightMidpoint);
  });
});

describe("sampleQuadraticBezier", () => {
  it("returns steps+1 points, starting at p0 and ending at p1", () => {
    const p0 = { x: 0, y: 0 };
    const control = { x: 50, y: 100 };
    const p1 = { x: 100, y: 0 };
    const points = sampleQuadraticBezier(p0, control, p1, 10);
    expect(points).toHaveLength(11);
    expect(points[0]).toEqual(p0);
    expect(points[10]).toEqual(p1);
  });
});

describe("buildInterpolatedFrame", () => {
  const from: Frame = {
    id: "f1",
    parentId: null,
    siblingOrder: 0,
    entities: [entity("a", 0, 0)],
    disc: { x: 0, y: 0 },
  };
  const to: Frame = {
    id: "f2",
    parentId: "f1",
    siblingOrder: 0,
    entities: [entity("a", 100, 50), entity("b", 20, 20)],
    disc: { x: 100, y: 50 },
  };

  it("interpolates a shared entity's position", () => {
    const mid = buildInterpolatedFrame(from, to, 0.5);
    expect(mid.entities.find((e) => e.id === "a")).toMatchObject({ x: 50, y: 25 });
  });

  it("shows an entity absent from the start frame directly at its target position", () => {
    const mid = buildInterpolatedFrame(from, to, 0.1);
    expect(mid.entities.find((e) => e.id === "b")).toMatchObject({ x: 20, y: 20 });
  });

  it("interpolates the disc position between two frames", () => {
    const mid = buildInterpolatedFrame(from, to, 0.5);
    expect(mid.disc).toEqual({ x: 50, y: 25 });
  });

  it("returns the 'to' frame's entities/disc unchanged at t=1", () => {
    const end = buildInterpolatedFrame(from, to, 1);
    expect(end.entities.find((e) => e.id === "a")).toMatchObject({ x: 100, y: 50 });
    expect(end.disc).toEqual({ x: 100, y: 50 });
  });

  it("preserves the 'to' frame's other fields (id, branchLabel, note...)", () => {
    const toWithNote: Frame = { ...to, note: "swing" };
    const mid = buildInterpolatedFrame(from, toWithNote, 0.5);
    expect(mid.id).toBe("f2");
    expect(mid.note).toBe("swing");
  });

  it("follows a Bézier curve for the disc when incomingCurves.disc is set", () => {
    const curvedTo: Frame = { ...to, incomingCurves: { disc: { x: 50, y: 100 } } };
    const mid = buildInterpolatedFrame(from, curvedTo, 0.5);
    // Ligne droite entre (0,0) et (100,50) donnerait y=25 ; la courbe s'écarte vers le contrôle (y=100).
    expect(mid.disc).toEqual({ x: 50, y: 62.5 });
  });

  it("follows a Bézier curve for an entity when incomingCurves has its id", () => {
    const curvedTo: Frame = { ...to, incomingCurves: { a: { x: 100, y: 100 } } };
    const mid = buildInterpolatedFrame(from, curvedTo, 0.5);
    const entityA = curvedTo.entities.find((e) => e.id === "a")!;
    const straightMid = interpolatePosition({ x: 0, y: 0 }, entityA, 0.5);
    expect(mid.entities.find((e) => e.id === "a")?.y).toBeGreaterThan(straightMid.y);
  });

  it("does not curve entities/disc without a matching incomingCurves entry", () => {
    const curvedTo: Frame = { ...to, incomingCurves: { disc: { x: 50, y: 100 } } };
    const mid = buildInterpolatedFrame(from, curvedTo, 0.5);
    expect(mid.entities.find((e) => e.id === "a")).toMatchObject({ x: 50, y: 25 });
  });
});
