import { beforeEach, describe, expect, it } from "vitest";
import { getFieldPreset } from "../domain/presets/field";
import { emptyPreset } from "../domain/presets/roster";
import { useActionEditorStore } from "./actionEditorStore";

const fieldConfig = getFieldPreset("half");

function startEmpty() {
  useActionEditorStore.getState().start(fieldConfig, emptyPreset());
}

describe("actionEditorStore", () => {
  beforeEach(() => {
    startEmpty();
  });

  it("start() initializes a single frame from the given preset", () => {
    const { frame } = useActionEditorStore.getState();
    expect(frame?.entities).toHaveLength(0);
    expect(frame?.disc).toEqual({ x: 50, y: 50 });
  });

  it("addEntity() appends an entity with an incrementing label per team", () => {
    const { addEntity } = useActionEditorStore.getState();
    addEntity("offense");
    addEntity("offense");
    addEntity("defense");

    const { frame } = useActionEditorStore.getState();
    const offenseLabels = frame?.entities.filter((e) => e.team === "offense").map((e) => e.label);
    const defenseLabels = frame?.entities.filter((e) => e.team === "defense").map((e) => e.label);
    expect(offenseLabels).toEqual(["1", "2"]);
    expect(defenseLabels).toEqual(["1"]);
  });

  it("moveEntity() updates only the targeted entity's position", () => {
    const { addEntity, moveEntity } = useActionEditorStore.getState();
    addEntity("offense");
    const id = useActionEditorStore.getState().frame!.entities[0].id;

    moveEntity(id, 12, 34);

    expect(useActionEditorStore.getState().frame?.entities[0]).toMatchObject({ x: 12, y: 34 });
  });

  it("removeEntity() drops the entity and clears selection if it was selected", () => {
    const { addEntity, selectEntity, removeEntity } = useActionEditorStore.getState();
    addEntity("offense");
    const id = useActionEditorStore.getState().frame!.entities[0].id;
    selectEntity(id);

    removeEntity(id);

    expect(useActionEditorStore.getState().frame?.entities).toHaveLength(0);
    expect(useActionEditorStore.getState().selectedEntityId).toBeNull();
  });

  it("removeEntity() frees the disc at its last position when the holder is removed", () => {
    const { addEntity, assignDiscTo, moveEntity, removeEntity } = useActionEditorStore.getState();
    addEntity("offense");
    const id = useActionEditorStore.getState().frame!.entities[0].id;
    assignDiscTo(id);
    moveEntity(id, 20, 30);

    removeEntity(id);

    expect(useActionEditorStore.getState().frame?.disc).toEqual({ x: 20, y: 30 });
  });

  it("assignDiscTo() ensures at most one holder", () => {
    const { addEntity, assignDiscTo } = useActionEditorStore.getState();
    addEntity("offense");
    addEntity("offense");
    const [first, second] = useActionEditorStore.getState().frame!.entities;

    assignDiscTo(first.id);
    assignDiscTo(second.id);

    const { frame } = useActionEditorStore.getState();
    expect(frame?.disc).toEqual({ heldBy: second.id });
    expect(frame?.entities.find((e) => e.id === first.id)?.hasDisc).toBeFalsy();
    expect(frame?.entities.find((e) => e.id === second.id)?.hasDisc).toBe(true);
  });

  it("freeDisc() detaches the disc at the holder's current position", () => {
    const { addEntity, assignDiscTo, moveEntity, freeDisc } = useActionEditorStore.getState();
    addEntity("offense");
    const id = useActionEditorStore.getState().frame!.entities[0].id;
    assignDiscTo(id);
    moveEntity(id, 15, 25);

    freeDisc();

    const { frame } = useActionEditorStore.getState();
    expect(frame?.disc).toEqual({ x: 15, y: 25 });
    expect(frame?.entities[0].hasDisc).toBeFalsy();
  });

  it("undo()/redo() round-trip through the history stack", () => {
    const { addEntity, moveEntity, undo, redo } = useActionEditorStore.getState();
    addEntity("offense");
    const id = useActionEditorStore.getState().frame!.entities[0].id;
    moveEntity(id, 10, 10);
    moveEntity(id, 90, 90);

    undo();
    expect(useActionEditorStore.getState().frame?.entities[0]).toMatchObject({ x: 10, y: 10 });

    undo();
    expect(useActionEditorStore.getState().frame?.entities[0]).toMatchObject({ x: 50, y: 50 });

    redo();
    expect(useActionEditorStore.getState().frame?.entities[0]).toMatchObject({ x: 10, y: 10 });

    redo();
    expect(useActionEditorStore.getState().frame?.entities[0]).toMatchObject({ x: 90, y: 90 });
  });

  it("a new action after undo clears the redo stack", () => {
    const { addEntity, moveEntity, undo } = useActionEditorStore.getState();
    addEntity("offense");
    const id = useActionEditorStore.getState().frame!.entities[0].id;
    moveEntity(id, 10, 10);
    undo();

    moveEntity(id, 77, 77);

    expect(useActionEditorStore.getState().future).toHaveLength(0);
  });
});
