import { beforeEach, describe, expect, it } from "vitest";
import { buildAction } from "../domain/action";
import type { FieldConfig, Frame } from "../domain/models";
import {
  deleteActionFromLibrary,
  getLastActiveActionId,
  listActionsFromLibrary,
  loadActionFromLibrary,
  saveActionToLibrary,
  setLastActiveActionId,
} from "./libraryStore";

const fieldConfig: FieldConfig = { type: "half", lengthMeters: 30, widthMeters: 18 };
const rootFrame: Frame = {
  id: "f1",
  parentId: null,
  siblingOrder: 0,
  entities: [],
  disc: { x: 50, y: 50 },
};

function makeAction(id: string) {
  return buildAction({
    id,
    name: `Action ${id}`,
    tags: [],
    fieldConfig,
    defaultTransitionMs: 1200,
    frames: [rootFrame],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
}

beforeEach(() => {
  localStorage.clear();
});

describe("libraryStore", () => {
  it("saves and reloads an action by id", () => {
    saveActionToLibrary(makeAction("a1"));
    expect(loadActionFromLibrary("a1")?.name).toBe("Action a1");
  });

  it("returns undefined for an unknown id", () => {
    expect(loadActionFromLibrary("missing")).toBeUndefined();
  });

  it("stores multiple actions independently, keyed by id", () => {
    saveActionToLibrary(makeAction("a1"));
    saveActionToLibrary(makeAction("a2"));
    expect(listActionsFromLibrary()).toHaveLength(2);
  });

  it("overwrites an action saved again under the same id", () => {
    saveActionToLibrary(makeAction("a1"));
    const updated = { ...makeAction("a1"), name: "Renommée" };
    saveActionToLibrary(updated);
    expect(listActionsFromLibrary()).toHaveLength(1);
    expect(loadActionFromLibrary("a1")?.name).toBe("Renommée");
  });

  it("deletes an action", () => {
    saveActionToLibrary(makeAction("a1"));
    deleteActionFromLibrary("a1");
    expect(loadActionFromLibrary("a1")).toBeUndefined();
  });

  it("tracks the last active action id", () => {
    expect(getLastActiveActionId()).toBeNull();
    setLastActiveActionId("a1");
    expect(getLastActiveActionId()).toBe("a1");
    setLastActiveActionId(null);
    expect(getLastActiveActionId()).toBeNull();
  });

  it("survives corrupted JSON in the storage key", () => {
    localStorage.setItem("ultimate-playbook:actions", "{not json");
    expect(listActionsFromLibrary()).toEqual([]);
    saveActionToLibrary(makeAction("a1"));
    expect(loadActionFromLibrary("a1")?.id).toBe("a1");
  });
});
