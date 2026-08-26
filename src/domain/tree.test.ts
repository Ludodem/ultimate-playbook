import { describe, expect, it } from "vitest";
import type { Frame } from "./models";
import {
  computeCurrentPathView,
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
