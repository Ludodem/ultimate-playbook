import { describe, expect, it } from "vitest";
import type { Frame } from "./models";
import {
  computeDisplayOrder,
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
    disc: {},
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

describe("computeDisplayOrder", () => {
  it("numbers frames in pre-order from the root, children by siblingOrder", () => {
    const order = computeDisplayOrder(frames);
    expect(order.get("root")).toBe(1);
    expect(order.get("a")).toBe(2);
    expect(order.get("b")).toBe(3);
    expect(order.get("c1")).toBe(4);
    expect(order.get("c2")).toBe(5);
    expect(order.get("d")).toBe(6);
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
