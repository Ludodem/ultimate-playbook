import { beforeEach, describe, expect, it } from "vitest";
import { getFieldPreset } from "../domain/presets/field";
import { emptyPreset } from "../domain/presets/roster";
import { getChildren } from "../domain/tree";
import { useActionEditorStore } from "./actionEditorStore";

const fieldConfig = getFieldPreset("half");

function startEmpty() {
  useActionEditorStore.getState().start(fieldConfig, emptyPreset(), "Test action");
}

function currentFrame() {
  const { frames, currentFrameId } = useActionEditorStore.getState();
  return frames.find((f) => f.id === currentFrameId)!;
}

describe("actionEditorStore", () => {
  beforeEach(() => {
    startEmpty();
  });

  it("start() creates a single root frame from the given preset", () => {
    const { frames, currentFrameId } = useActionEditorStore.getState();
    expect(frames).toHaveLength(1);
    expect(frames[0].parentId).toBeNull();
    expect(currentFrameId).toBe(frames[0].id);
  });

  it("addEntity() appends an entity with an incrementing label per team, on the current frame", () => {
    const { addEntity } = useActionEditorStore.getState();
    addEntity("offense");
    addEntity("offense");
    addEntity("defense");

    const offenseLabels = currentFrame()
      .entities.filter((e) => e.team === "offense")
      .map((e) => e.label);
    const defenseLabels = currentFrame()
      .entities.filter((e) => e.team === "defense")
      .map((e) => e.label);
    expect(offenseLabels).toEqual(["1", "2"]);
    expect(defenseLabels).toEqual(["1"]);
  });

  it("moveEntity() / moveDisc() / removeEntity() behave as in Phase 3, scoped to the current frame", () => {
    const { addEntity, moveEntity, moveDisc, removeEntity } = useActionEditorStore.getState();
    addEntity("offense");
    const id = currentFrame().entities[0].id;

    moveEntity(id, 12, 34);
    expect(currentFrame().entities[0]).toMatchObject({ x: 12, y: 34 });

    moveDisc(12, 34);
    expect(currentFrame().disc).toEqual({ x: 12, y: 34 });

    removeEntity(id);
    expect(currentFrame().entities).toHaveLength(0);
  });

  describe("addNextFrame", () => {
    it("creates a single child continuation of the current frame and selects it", () => {
      const rootId = useActionEditorStore.getState().currentFrameId!;
      useActionEditorStore.getState().addNextFrame();

      const { frames, currentFrameId } = useActionEditorStore.getState();
      expect(frames).toHaveLength(2);
      expect(currentFrameId).not.toBe(rootId);
      expect(getChildren(frames, rootId)).toHaveLength(1);
      expect(getChildren(frames, rootId)[0].id).toBe(currentFrameId);
    });

    it("copies the current frame's entities/disc into the new frame", () => {
      useActionEditorStore.getState().addEntity("offense");
      useActionEditorStore.getState().moveDisc(12, 34);

      useActionEditorStore.getState().addNextFrame();

      expect(currentFrame().entities).toHaveLength(1);
      expect(currentFrame().disc).toEqual({ x: 12, y: 34 });
    });

    it("is a no-op when the current frame already has a child", () => {
      useActionEditorStore.getState().addNextFrame();
      const frameCountAfterFirst = useActionEditorStore.getState().frames.length;

      useActionEditorStore.getState().selectFrame(useActionEditorStore.getState().frames[0].id);
      useActionEditorStore.getState().addNextFrame();

      expect(useActionEditorStore.getState().frames).toHaveLength(frameCountAfterFirst);
    });
  });

  describe("addBranch / renameBranch", () => {
    it("creates a labeled second child and retroactively labels the pre-existing one", () => {
      useActionEditorStore.getState().addNextFrame();
      const rootId = useActionEditorStore.getState().frames.find((f) => f.parentId === null)!.id;
      const firstChildId = getChildren(useActionEditorStore.getState().frames, rootId)[0].id;
      useActionEditorStore.getState().selectFrame(rootId);

      useActionEditorStore.getState().addBranch("Strike");

      const { frames, currentFrameId } = useActionEditorStore.getState();
      const children = getChildren(frames, rootId);
      expect(children).toHaveLength(2);
      expect(children.find((f) => f.id === firstChildId)?.branchLabel).toBe("Option 1");
      expect(children.find((f) => f.id === currentFrameId)?.branchLabel).toBe("Strike");
    });

    it("does not touch the existing branchLabel when the parent is already a fork", () => {
      useActionEditorStore.getState().addBranch("Autour");
      const rootId = useActionEditorStore.getState().frames.find((f) => f.parentId === null)!.id;
      useActionEditorStore.getState().selectFrame(rootId);

      useActionEditorStore.getState().addBranch("Strike");

      const children = getChildren(useActionEditorStore.getState().frames, rootId);
      expect(children.map((c) => c.branchLabel)).toEqual(["Autour", "Strike"]);
    });

    it("renameBranch() overrides a branch's label", () => {
      useActionEditorStore.getState().addBranch("Autour");
      const branchId = useActionEditorStore.getState().currentFrameId!;

      useActionEditorStore.getState().renameBranch(branchId, "Around");

      expect(currentFrame().branchLabel).toBe("Around");
    });
  });

  describe("deleteFrame", () => {
    it("is a no-op on the root frame", () => {
      const rootId = useActionEditorStore.getState().currentFrameId!;
      useActionEditorStore.getState().deleteFrame(rootId);
      expect(useActionEditorStore.getState().frames).toHaveLength(1);
    });

    it("removes a frame and its whole subtree", () => {
      useActionEditorStore.getState().addNextFrame();
      const childId = useActionEditorStore.getState().currentFrameId!;
      useActionEditorStore.getState().addNextFrame(); // grandchild

      useActionEditorStore.getState().deleteFrame(childId);

      expect(useActionEditorStore.getState().frames).toHaveLength(1);
    });

    it("falls back to the parent when the deleted subtree contained the current frame", () => {
      const rootId = useActionEditorStore.getState().currentFrameId!;
      useActionEditorStore.getState().addNextFrame();
      const childId = useActionEditorStore.getState().currentFrameId!;

      useActionEditorStore.getState().deleteFrame(childId);

      expect(useActionEditorStore.getState().currentFrameId).toBe(rootId);
    });
  });

  describe("moveFrameUp / moveFrameDown", () => {
    it("swaps a frame with its single-child parent", () => {
      const rootId = useActionEditorStore.getState().currentFrameId!;
      useActionEditorStore.getState().addNextFrame();
      const childId = useActionEditorStore.getState().currentFrameId!;

      useActionEditorStore.getState().moveFrameUp(childId);

      const { frames } = useActionEditorStore.getState();
      expect(frames.find((f) => f.id === childId)?.parentId).toBeNull();
      expect(frames.find((f) => f.id === rootId)?.parentId).toBe(childId);
    });

    it("is a no-op when the parent is a fork", () => {
      const rootId = useActionEditorStore.getState().currentFrameId!;
      useActionEditorStore.getState().addBranch("Autour");
      useActionEditorStore.getState().selectFrame(rootId);
      useActionEditorStore.getState().addBranch("Strike"); // root a maintenant 2 enfants : un vrai fork
      const branchId = useActionEditorStore.getState().currentFrameId!;
      const before = useActionEditorStore.getState().frames;

      useActionEditorStore.getState().moveFrameUp(branchId);

      expect(useActionEditorStore.getState().frames).toEqual(before);
    });

    it("moveFrameDown swaps a frame with its single child", () => {
      const rootId = useActionEditorStore.getState().currentFrameId!;
      useActionEditorStore.getState().addNextFrame();
      const childId = useActionEditorStore.getState().currentFrameId!;

      useActionEditorStore.getState().moveFrameDown(rootId);

      const { frames } = useActionEditorStore.getState();
      expect(frames.find((f) => f.id === childId)?.parentId).toBeNull();
      expect(frames.find((f) => f.id === rootId)?.parentId).toBe(childId);
    });
  });

  describe("setDiscCurveControlPoint", () => {
    it("stores a control point for the disc on the current frame", () => {
      useActionEditorStore.getState().addEntity("offense");
      useActionEditorStore.getState().moveDisc(70, 30);
      useActionEditorStore.getState().addNextFrame();

      useActionEditorStore.getState().setDiscCurveControlPoint({ x: 70, y: 20 });

      expect(currentFrame().incomingCurves).toEqual({ disc: { x: 70, y: 20 } });
    });

    it("clears the disc entry (and incomingCurves entirely) when passed null", () => {
      useActionEditorStore.getState().addNextFrame();
      useActionEditorStore.getState().setDiscCurveControlPoint({ x: 70, y: 20 });

      useActionEditorStore.getState().setDiscCurveControlPoint(null);

      expect(currentFrame().incomingCurves).toBeUndefined();
    });
  });

  describe("undo / redo", () => {
    it("restores both the frame tree and the previously viewed frame", () => {
      const rootId = useActionEditorStore.getState().currentFrameId!;
      useActionEditorStore.getState().addNextFrame();
      const childId = useActionEditorStore.getState().currentFrameId!;

      useActionEditorStore.getState().undo();
      expect(useActionEditorStore.getState().frames).toHaveLength(1);
      expect(useActionEditorStore.getState().currentFrameId).toBe(rootId);

      useActionEditorStore.getState().redo();
      expect(useActionEditorStore.getState().frames).toHaveLength(2);
      expect(useActionEditorStore.getState().currentFrameId).toBe(childId);
    });

    it("a new action after undo clears the redo stack", () => {
      useActionEditorStore.getState().addNextFrame();
      useActionEditorStore.getState().undo();

      useActionEditorStore.getState().addEntity("offense");

      expect(useActionEditorStore.getState().future).toHaveLength(0);
    });
  });
});
