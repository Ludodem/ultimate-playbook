import { describe, expect, it } from "vitest";
import { DEFAULT_FIELD_COLORS, resolveFieldColors } from "./fieldColors";
import { getFieldPreset } from "./field";

describe("getFieldPreset", () => {
  it("returns a half field with an endzone and the default colors", () => {
    const config = getFieldPreset("half");
    expect(config.type).toBe("half");
    expect(config.endzoneMeters).toBeGreaterThan(0);
    expect(config.colors).toEqual(DEFAULT_FIELD_COLORS);
  });

  it("returns a full field twice as long as half field", () => {
    const half = getFieldPreset("half");
    const full = getFieldPreset("full");
    expect(full.lengthMeters).toBeGreaterThan(half.lengthMeters);
    expect(full.endzoneMeters).toBeGreaterThan(0);
  });

  it("returns an undefined-type field without an endzone", () => {
    const config = getFieldPreset("undefined");
    expect(config.endzoneMeters).toBeUndefined();
  });
});

describe("resolveFieldColors", () => {
  it("falls back to the defaults when no override is given", () => {
    expect(resolveFieldColors()).toEqual(DEFAULT_FIELD_COLORS);
  });

  it("merges a partial override on top of the defaults", () => {
    const resolved = resolveFieldColors({ endzone: "#FF0000" });
    expect(resolved.endzone).toBe("#FF0000");
    expect(resolved.field).toBe(DEFAULT_FIELD_COLORS.field);
    expect(resolved.lines).toBe(DEFAULT_FIELD_COLORS.lines);
  });
});
