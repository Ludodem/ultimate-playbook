import { describe, expect, it } from "vitest";
import { actionFileName, buildAction, validateAction } from "./action";
import type { Action, FieldConfig, Frame } from "./models";

const fieldConfig: FieldConfig = { type: "half", lengthMeters: 30, widthMeters: 18 };

const rootFrame: Frame = {
  id: "f1",
  parentId: null,
  siblingOrder: 0,
  entities: [{ id: "e1", team: "offense", label: "1", x: 50, y: 50 }],
  disc: { x: 50, y: 50 },
};

function validAction(): Action {
  return buildAction({
    id: "a1",
    name: "Sortie de ligne",
    tags: ["strike"],
    fieldConfig,
    defaultTransitionMs: 1200,
    frames: [rootFrame],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
}

describe("buildAction", () => {
  it("assembles a full Action with schemaVersion 1", () => {
    const action = validAction();
    expect(action.schemaVersion).toBe(1);
    expect(action.id).toBe("a1");
    expect(action.frames).toHaveLength(1);
  });
});

describe("actionFileName", () => {
  it("slugifies the action name", () => {
    expect(actionFileName("Sortie de ligne (H)")).toBe("sortie-de-ligne-h.json");
  });

  it("falls back to a generic name when empty/only symbols", () => {
    expect(actionFileName("   ")).toBe("action.json");
  });
});

describe("validateAction", () => {
  it("accepts a well-formed action", () => {
    const result = validateAction(validAction());
    expect(result.ok).toBe(true);
  });

  it("rejects non-object input", () => {
    const result = validateAction("not an action");
    expect(result.ok).toBe(false);
  });

  it("rejects an unsupported schemaVersion", () => {
    const result = validateAction({ ...validAction(), schemaVersion: 2 });
    expect(result.ok).toBe(false);
  });

  it("rejects an action with no frames", () => {
    const result = validateAction({ ...validAction(), frames: [] });
    expect(result.ok).toBe(false);
  });

  it("rejects an action with more than one root frame", () => {
    const secondRoot: Frame = { ...rootFrame, id: "f2" };
    const result = validateAction({ ...validAction(), frames: [rootFrame, secondRoot] });
    expect(result.ok).toBe(false);
  });

  it("rejects an action with no root frame", () => {
    const orphan: Frame = { ...rootFrame, parentId: "missing" };
    const result = validateAction({ ...validAction(), frames: [orphan] });
    expect(result.ok).toBe(false);
  });

  it("rejects a frame with an invalid entity", () => {
    const badFrame = { ...rootFrame, entities: [{ id: "e1", team: "goalkeeper", x: 1, y: 1 }] };
    const result = validateAction({ ...validAction(), frames: [badFrame] });
    expect(result.ok).toBe(false);
  });

  it("rejects a missing required field", () => {
    const withoutName: Partial<Action> = { ...validAction() };
    delete withoutName.name;
    const result = validateAction(withoutName);
    expect(result.ok).toBe(false);
  });
});
