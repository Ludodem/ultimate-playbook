import { describe, expect, it } from "vitest";
import { findColocatedEntity } from "./disc";
import type { Entity } from "./models";

const holder: Entity = { id: "o1", team: "offense", label: "1", x: 40, y: 60 };
const other: Entity = { id: "o2", team: "offense", label: "2", x: 20, y: 30 };

describe("findColocatedEntity", () => {
  it("finds an entity at (quasi-)exactly the given position", () => {
    expect(findColocatedEntity({ x: 40, y: 60 }, [holder, other])?.id).toBe("o1");
  });

  it("tolerates tiny floating point differences", () => {
    expect(findColocatedEntity({ x: 40.001, y: 59.999 }, [holder, other])?.id).toBe("o1");
  });

  it("returns undefined when no entity is at that position", () => {
    expect(findColocatedEntity({ x: 10, y: 10 }, [holder, other])).toBeUndefined();
  });

  it("returns undefined for a position just outside the tolerance", () => {
    expect(findColocatedEntity({ x: 40.05, y: 60 }, [holder, other])).toBeUndefined();
  });
});
