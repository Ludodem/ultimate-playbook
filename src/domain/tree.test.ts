import { describe, expect, it } from "vitest";
import type { Frame } from "./models";
import {
  computeCurrentPathView,
  getChildren,
  getRootFrame,
  getSubtreeIds,
  isForkFrame,
  resolvePath,
} from "./tree";

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
//                    +-> c2 (label "Strike") -> d
const root = frame("root", null);
const a = frame("a", "root");
const b = frame("b", "a");
const c1 = frame("c1", "b", 0, "Autour");
const c2 = frame("c2", "b", 1, "Strike");
const d = frame("d", "c2");
const frames = [root, a, b, c1, c2, d];

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
    expect(getChildren(frames, "d")).toEqual([]);
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
    expect(new Set(getSubtreeIds(frames, "b"))).toEqual(new Set(["b", "c1", "c2", "d"]));
  });

  it("is just the frame itself for a leaf", () => {
    expect(getSubtreeIds(frames, "d")).toEqual(["d"]);
  });
});

describe("resolvePath", () => {
  it("follows single-child continuations without needing a choice", () => {
    const path = resolvePath(frames, {});
    expect(path.map((f) => f.id)).toEqual(["root", "a", "b"]);
  });

  it("follows the chosen branch at a fork", () => {
    const path = resolvePath(frames, { b: "c2" });
    expect(path.map((f) => f.id)).toEqual(["root", "a", "b", "c2", "d"]);
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
  it("extends the chain in both directions up to the fork, from any frame on the unambiguous stretch", () => {
    for (const currentId of ["root", "a"]) {
      const view = computeCurrentPathView(frames, currentId);
      expect(view.chain.map((f) => f.id)).toEqual(["root", "a", "b"]);
      expect(view.forkOptions.map((f) => f.id)).toEqual(["c1", "c2"]);
    }
  });

  it("includes all ancestors and shows no fork options for a leaf on a branch", () => {
    const view = computeCurrentPathView(frames, "c1");
    expect(view.chain.map((f) => f.id)).toEqual(["root", "a", "b", "c1"]);
    expect(view.forkOptions).toEqual([]);
  });

  it("extends through a simple continuation past a fork (d after c2)", () => {
    const view = computeCurrentPathView(frames, "d");
    expect(view.chain.map((f) => f.id)).toEqual(["root", "a", "b", "c2", "d"]);
    expect(view.forkOptions).toEqual([]);
  });

  it("returns an empty view when there is no current frame or it is unknown", () => {
    expect(computeCurrentPathView(frames, null)).toEqual({ chain: [], forkOptions: [] });
    expect(computeCurrentPathView(frames, "missing")).toEqual({ chain: [], forkOptions: [] });
  });
});
