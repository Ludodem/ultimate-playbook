import { describe, expect, it } from "vitest";
import {
  computeEndzones,
  computeVisibleXRangePercent,
  endzoneGoalLine,
  fitFieldStageSize,
  projectRect,
  projectToScreen,
  unprojectFromScreen,
  widthAxisPixelSpan,
  type VisibleRange,
} from "./geometry";
import type { FieldConfig } from "./models";

const half: FieldConfig = { type: "half", lengthMeters: 30, widthMeters: 18, endzoneMeters: 8 };
const full: FieldConfig = { type: "full", lengthMeters: 60, widthMeters: 18, endzoneMeters: 8 };
const undefinedField: FieldConfig = { type: "undefined", lengthMeters: 20, widthMeters: 18 };

describe("computeEndzones", () => {
  it("returns a single band at the start of the field for a half field", () => {
    const bands = computeEndzones(half);
    expect(bands).toHaveLength(1);
    expect(bands[0].yStart).toBe(0);
    expect(bands[0].yEnd).toBeCloseTo((8 / 30) * 100);
  });

  it("returns two bands (one at each end) for a full field", () => {
    const bands = computeEndzones(full);
    expect(bands).toHaveLength(2);
    expect(bands[0].yStart).toBe(0);
    expect(bands[1].yEnd).toBe(100);
  });

  it("returns no band for an undefined-type field", () => {
    expect(computeEndzones(undefinedField)).toEqual([]);
  });
});

describe("endzoneGoalLine", () => {
  it("is the band's end when it starts at the field's start", () => {
    expect(endzoneGoalLine({ yStart: 0, yEnd: 26.7 })).toBeCloseTo(26.7);
  });

  it("is the band's start when it ends at the field's end", () => {
    expect(endzoneGoalLine({ yStart: 86.7, yEnd: 100 })).toBeCloseTo(86.7);
  });
});

describe("computeVisibleXRangePercent", () => {
  it("is exactly [0, 100] when no sideline margin is set", () => {
    expect(computeVisibleXRangePercent(half)).toEqual({ min: 0, max: 100 });
  });

  it("is exactly [0, 100] when the margin is explicitly 0", () => {
    expect(computeVisibleXRangePercent({ ...half, sidelineMarginMeters: 0 })).toEqual({
      min: 0,
      max: 100,
    });
  });

  it("shifts by the margin (one sideline only) rather than extending symmetrically", () => {
    const withMargin = { ...half, sidelineMarginMeters: 3.6 }; // 20% of widthMeters (18)
    expect(computeVisibleXRangePercent(withMargin)).toEqual({ min: 20, max: 120 });
  });

  it("always spans exactly 100 percentage points, with or without margin", () => {
    expect(computeVisibleXRangePercent(half).max - computeVisibleXRangePercent(half).min).toBe(100);
    const withMargin = { ...half, sidelineMarginMeters: 5 };
    const range = computeVisibleXRangePercent(withMargin);
    expect(range.max - range.min).toBe(100);
  });
});

const range: VisibleRange = { min: 0, max: 100 };
const STAGE_W = 200;
const STAGE_H = 400;

describe("projectToScreen", () => {
  it("in portrait, maps width to X and length to Y", () => {
    expect(projectToScreen(0, 0, STAGE_W, STAGE_H, range, "portrait")).toEqual({ x: 0, y: 0 });
    expect(projectToScreen(100, 100, STAGE_W, STAGE_H, range, "portrait")).toEqual({
      x: STAGE_W,
      y: STAGE_H,
    });
    expect(projectToScreen(50, 25, STAGE_W, STAGE_H, range, "portrait")).toEqual({
      x: STAGE_W / 2,
      y: STAGE_H / 4,
    });
  });

  it("in landscape, maps length to X (reversed, attack goes right) and width to Y", () => {
    // length=0 (goal side) -> rightmost X ; length=100 -> leftmost X.
    expect(projectToScreen(0, 0, STAGE_W, STAGE_H, range, "landscape")).toEqual({
      x: STAGE_W,
      y: 0,
    });
    expect(projectToScreen(100, 100, STAGE_W, STAGE_H, range, "landscape")).toEqual({
      x: 0,
      y: STAGE_H,
    });
  });

  it("honors a shifted visible range (sideline margin) on the width axis in both orientations", () => {
    const shifted: VisibleRange = { min: 20, max: 120 };
    expect(projectToScreen(20, 0, STAGE_W, STAGE_H, shifted, "portrait")).toEqual({ x: 0, y: 0 });
    expect(projectToScreen(20, 0, STAGE_W, STAGE_H, shifted, "landscape")).toEqual({
      x: STAGE_W,
      y: 0,
    });
  });
});

describe("unprojectFromScreen", () => {
  it("is the inverse of projectToScreen in portrait", () => {
    for (const [w, l] of [
      [0, 0],
      [100, 100],
      [37, 64],
    ]) {
      const p = projectToScreen(w, l, STAGE_W, STAGE_H, range, "portrait");
      const back = unprojectFromScreen(p.x, p.y, STAGE_W, STAGE_H, range, "portrait");
      expect(back.widthPercent).toBeCloseTo(w);
      expect(back.lengthPercent).toBeCloseTo(l);
    }
  });

  it("is the inverse of projectToScreen in landscape", () => {
    for (const [w, l] of [
      [0, 0],
      [100, 100],
      [37, 64],
    ]) {
      const p = projectToScreen(w, l, STAGE_W, STAGE_H, range, "landscape");
      const back = unprojectFromScreen(p.x, p.y, STAGE_W, STAGE_H, range, "landscape");
      expect(back.widthPercent).toBeCloseTo(w);
      expect(back.lengthPercent).toBeCloseTo(l);
    }
  });
});

describe("projectRect", () => {
  it("builds the same axis-aligned rect regardless of corner order, in portrait", () => {
    const rect = projectRect(0, 0, 100, 50, STAGE_W, STAGE_H, range, "portrait");
    expect(rect).toEqual({ x: 0, y: 0, width: STAGE_W, height: STAGE_H / 2 });
    expect(projectRect(100, 50, 0, 0, STAGE_W, STAGE_H, range, "portrait")).toEqual(rect);
  });

  it("swaps which screen axis is bounded in landscape", () => {
    // Width-bounded [0,100] x length-bounded [0,50] becomes a rect that
    // spans the full width axis (now Y) and half the length axis (now X).
    const rect = projectRect(0, 0, 100, 50, STAGE_W, STAGE_H, range, "landscape");
    expect(rect).toEqual({ x: STAGE_W / 2, y: 0, width: STAGE_W / 2, height: STAGE_H });
  });
});

describe("fitFieldStageSize", () => {
  const config: FieldConfig = { type: "half", lengthMeters: 30, widthMeters: 18 };

  it("in portrait, derives height from width (taller than wide) when height is unconstrained", () => {
    const { width, height } = fitFieldStageSize(180, 0, config, "portrait");
    expect(width).toBe(180);
    expect(height).toBeCloseTo(180 * (30 / 18));
  });

  it("in portrait, falls back to height-driven sizing when width-driven height overflows", () => {
    const { width, height } = fitFieldStageSize(180, 100, config, "portrait");
    expect(height).toBe(100);
    expect(width).toBeCloseTo(100 / (30 / 18));
  });

  it("in landscape, derives a wider-than-tall stage from the same config", () => {
    const { width, height } = fitFieldStageSize(180, 0, config, "landscape");
    expect(width).toBe(180);
    expect(height).toBeCloseTo(180 / (30 / 18));
    expect(width).toBeGreaterThan(height);
  });

  it("in landscape, falls back to height-driven sizing when width-driven height overflows", () => {
    const { width, height } = fitFieldStageSize(400, 100, config, "landscape");
    expect(height).toBe(100);
    expect(width).toBeCloseTo(100 * (30 / 18));
  });
});

describe("widthAxisPixelSpan", () => {
  it("is the stage width in portrait, the stage height in landscape", () => {
    expect(widthAxisPixelSpan(STAGE_W, STAGE_H, "portrait")).toBe(STAGE_W);
    expect(widthAxisPixelSpan(STAGE_W, STAGE_H, "landscape")).toBe(STAGE_H);
  });
});
