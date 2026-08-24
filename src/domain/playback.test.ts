import { describe, expect, it } from "vitest";
import type { Frame } from "./models";
import { DEFAULT_TRANSITION_MS, resolveTransitionMs } from "./playback";

const baseFrame: Frame = { id: "f", parentId: null, siblingOrder: 0, entities: [], disc: {} };

describe("resolveTransitionMs", () => {
  it("falls back to DEFAULT_TRANSITION_MS when the frame doesn't specify one", () => {
    expect(resolveTransitionMs(baseFrame)).toBe(DEFAULT_TRANSITION_MS);
  });

  it("uses the frame's own transitionMs when set", () => {
    expect(resolveTransitionMs({ ...baseFrame, transitionMs: 400 })).toBe(400);
  });
});
