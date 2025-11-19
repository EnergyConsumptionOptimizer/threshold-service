import { describe, expect, it } from "vitest";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { InvalidThresholdValueError } from "@domain/errors";

describe("ThresholdValue", () => {
  it("should create valid positive values", () => {
    const value = ThresholdValue.of(100);
    const small = ThresholdValue.of(0.001);

    expect(value.valueOf()).toBe(100);
    expect(small.valueOf()).toBe(0.001);
  });

  it("should reject zero and negative values", () => {
    expect(() => ThresholdValue.of(0)).toThrow(InvalidThresholdValueError);
    expect(() => ThresholdValue.of(-1)).toThrow(InvalidThresholdValueError);
  });

  it("should compare values for equality", () => {
    const value1 = ThresholdValue.of(100);
    const value2 = ThresholdValue.of(100);
    const different = ThresholdValue.of(50);

    expect(value1.equals(value2)).toBe(true);
    expect(value1.equals(different)).toBe(false);
  });

  it("should detect when a measured value breaches the threshold", () => {
    const threshold = ThresholdValue.of(100);

    expect(threshold.isBreachedBy(150)).toBe(true);
    expect(threshold.isBreachedBy(100)).toBe(false);
    expect(threshold.isBreachedBy(50)).toBe(false);
  });

  it("should convert to string and primitive correctly", () => {
    const value = ThresholdValue.of(100);

    expect(value.toString()).toBe("100");
    expect(value.valueOf()).toBe(100);
  });
});
