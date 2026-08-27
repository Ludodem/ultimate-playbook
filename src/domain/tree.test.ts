import { describe, expect, it } from "vitest";
import type { Frame } from "./models";
import {
  computeCurrentPathView,
  computeFullTreeRows,
  getChildren,
  getRootFrame,
  getSubtreeIds,
  isForkFrame,
  resolvePath,
  type PathSegment,
} from "./tree";

function describeSegments(segments: PathSegment[]) {
  return segments.map((s) =>
    s.kind === "frame" ? s.frame.id : { branch: s.options.map((o) => o.id), active: s.activeId },
  );
}

function frame(id: string, parentId: string | null, siblingOrder = 0, branchLabel?: string): Frame {
  return {
    id,
    parentId,
    siblingOrder,
    branchLabel,
    entities: [],
    disc: { x: 50, y: 50 },
  };
}

// Arbre de test :
//   root -> a -> b -+-> c1 (label "Autour")
//                    +-> c2 (label "Strike") -> d -> e (label "Contre", seule
//                                                       option pour l'instant)
const root = frame("root", null);
const a = frame("a", "root");
const b = frame("b", "a");
const c1 = frame("c1", "b", 0, "Autour");
const c2 = frame("c2", "b", 1, "Strike");
const d = frame("d", "c2");
const e = frame("e", "d", 0, "Contre");
const frames = [root, a, b, c1, c2, d, e];

describe("getRootFrame", () => {
  it("finds the frame with parentId === null", () => {
    expect(getRootFrame(frames)?.id).toBe("root");
  });

  it("returns undefined for an empty list", () => {
    expect(getRootFrame([])).toBeUndefined();
  });
});

describe("getChildren", () => {
  it("returns direct children sorted by siblingOrder", () => {
    expect(getChildren(frames, "b").map((f) => f.id)).toEqual(["c1", "c2"]);
  });

  it("returns an empty array for a leaf", () => {
    expect(getChildren(frames, "e")).toEqual([]);
  });
});

describe("isForkFrame", () => {
  it("is true for a frame with more than one child", () => {
    expect(isForkFrame(frames, "b")).toBe(true);
  });

  it("is false for a simple continuation or a leaf", () => {
    expect(isForkFrame(frames, "a")).toBe(false);
    expect(isForkFrame(frames, "d")).toBe(false);
  });
});

describe("getSubtreeIds", () => {
  it("includes the frame itself and all its descendants", () => {
    expect(new Set(getSubtreeIds(frames, "b"))).toEqual(new Set(["b", "c1", "c2", "d", "e"]));
  });

  it("is just the frame itself for a leaf", () => {
    expect(getSubtreeIds(frames, "e")).toEqual(["e"]);
  });
});

describe("resolvePath", () => {
  it("follows single-child continuations without needing a choice", () => {
    const path = resolvePath(frames, {});
    expect(path.map((f) => f.id)).toEqual(["root", "a", "b"]);
  });

  it("follows the chosen branch at a fork", () => {
    const path = resolvePath(frames, { b: "c2" });
    expect(path.map((f) => f.id)).toEqual(["root", "a", "b", "c2", "d", "e"]);
  });

  it("stops at a fork when the other branch is chosen", () => {
    const path = resolvePath(frames, { b: "c1" });
    expect(path.map((f) => f.id)).toEqual(["root", "a", "b", "c1"]);
  });

  it("returns an empty path when there is no root", () => {
    expect(resolvePath([])).toEqual([]);
  });
});

describe("computeCurrentPathView", () => {
  it("ends on an unresolved branch segment when standing on it (or anywhere on the unambiguous stretch before it)", () => {
    for (const currentId of ["root", "a"]) {
      const view = computeCurrentPathView(frames, currentId);
      expect(describeSegments(view.segments)).toEqual([
        "root",
        "a",
        "b",
        { branch: ["c1", "c2"], active: null },
      ]);
    }
  });

  it("shows a resolved branch segment (with the taken branch as active) right before a leaf on that branch", () => {
    const view = computeCurrentPathView(frames, "c1");
    expect(describeSegments(view.segments)).toEqual([
      "root",
      "a",
      "b",
      { branch: ["c1", "c2"], active: "c1" },
      "c1",
    ]);
  });

  it("keeps the resolved branch segment visible further down the branch, and shows a second one for a branch created with a single option so far (d -> e)", () => {
    for (const currentId of ["d", "e"]) {
      const view = computeCurrentPathView(frames, currentId);
      expect(describeSegments(view.segments)).toEqual([
        "root",
        "a",
        "b",
        { branch: ["c1", "c2"], active: "c2" },
        "c2",
        "d",
        { branch: ["e"], active: "e" },
        "e",
      ]);
    }
  });

  it("returns an empty view when there is no current frame or it is unknown", () => {
    expect(computeCurrentPathView(frames, null)).toEqual({ segments: [] });
    expect(computeCurrentPathView(frames, "missing")).toEqual({ segments: [] });
  });
});

describe("computeFullTreeRows", () => {
  it("flattens the whole tree in pre-order, indenting only at a labeled branch", () => {
    const rows = computeFullTreeRows(frames);
    expect(rows.map((r) => r.frame.id)).toEqual(["root", "a", "b", "c1", "c2", "d", "e"]);
    const depthById = Object.fromEntries(rows.map((r) => [r.frame.id, r.visualDepth]));
    // root -> a -> b share the same visual depth (no branch yet).
    expect(depthById).toMatchObject({ root: 0, a: 0, b: 0 });
    // b forks into c1/c2: both step in one level. c2 -> d is a plain
    // continuation (stays at the same level), but d -> e steps in again since
    // `e` itself carries a branchLabel (see the "immediate feedback" test).
    expect(depthById).toMatchObject({ c1: 1, c2: 1, d: 1, e: 2 });
  });

  it("numbers generation continuously from the root regardless of branching", () => {
    const rows = computeFullTreeRows(frames);
    const generationById = Object.fromEntries(rows.map((r) => [r.frame.id, r.generation]));
    expect(generationById).toEqual({ root: 1, a: 2, b: 3, c1: 4, c2: 4, d: 5, e: 6 });
  });

  it("colors each fork's options distinctly and propagates the color down an unforked chain", () => {
    const rows = computeFullTreeRows(frames);
    const colorById = Object.fromEntries(rows.map((r) => [r.frame.id, r.branchColorIndex]));
    expect(colorById.root).toBeNull();
    expect(colorById.a).toBeNull();
    expect(colorById.b).toBeNull();
    expect(colorById.c1).toBe(0);
    expect(colorById.c2).toBe(1);
    expect(colorById.d).toBe(1); // inherits c2's color, no branch in between
    expect(colorById.e).toBe(0); // its own color: `e` itself carries a branchLabel
  });

  it("returns an empty list when there is no root", () => {
    expect(computeFullTreeRows([])).toEqual([]);
  });

  it("gives immediate depth/color feedback for a branch with only one option so far", () => {
    // Mirrors the `d -> e` case in computeCurrentPathView: `e` has a
    // branchLabel despite being an only child (no second option yet) — this
    // must still step in a level and get a color, not wait for a sibling.
    const rows = computeFullTreeRows(frames);
    const eRow = rows.find((r) => r.frame.id === "e")!;
    const dRow = rows.find((r) => r.frame.id === "d")!;
    expect(eRow.visualDepth).toBe(dRow.visualDepth + 1);
    expect(eRow.branchColorIndex).toBe(0);
  });
});
