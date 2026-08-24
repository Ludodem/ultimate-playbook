import { describe, expect, it } from "vitest";
import { resolveDiscPosition } from "./disc";
import type { Entity } from "./models";

const holder: Entity = { id: "o1", team: "offense", label: "1", x: 40, y: 60, hasDisc: true };
const other: Entity = { id: "o2", team: "offense", label: "2", x: 20, y: 30 };

describe("resolveDiscPosition", () => {
  it("returns the holder's position when heldBy is set", () => {
    expect(resolveDiscPosition({ heldBy: "o1" }, [holder, other])).toEqual({ x: 40, y: 60 });
  });

  it("returns the free position when heldBy is absent", () => {
    expect(resolveDiscPosition({ x: 55, y: 25 }, [holder, other])).toEqual({ x: 55, y: 25 });
  });

  it("returns null when heldBy points to a missing entity and no free position is set", () => {
    expect(resolveDiscPosition({ heldBy: "missing" }, [holder, other])).toBeNull();
  });

  it("returns null when nothing is set", () => {
    expect(resolveDiscPosition({}, [holder, other])).toBeNull();
  });
});
