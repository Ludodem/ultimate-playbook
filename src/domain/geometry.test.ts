import { describe, expect, it } from "vitest";
import { computeEndzones, endzoneGoalLine } from "./geometry";
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
