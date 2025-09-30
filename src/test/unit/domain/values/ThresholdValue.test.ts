import { describe, it, expect } from "vitest";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { InvalidThresholdValueError } from "@domain/errors";

describe("ThresholdValue", () => {
  it("should create valid positive values", () => {
    expect(ThresholdValue.of(100).value).toBe(100);
    expect(ThresholdValue.of(50.5).value).toBe(50.5);
    expect(ThresholdValue.of(0.001).value).toBe(0.001);
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

  it("should compare values for ordering", () => {
    const small = ThresholdValue.of(50);
    const large = ThresholdValue.of(100);

    expect(large.isGreaterThan(small)).toBe(true);
    expect(small.isLessThan(large)).toBe(true);
    expect(large.isGreaterThanOrEqual(small)).toBe(true);
    expect(small.isLessThanOrEqual(large)).toBe(true);
  });

  it("should convert to primitive correctly", () => {
    const value = ThresholdValue.of(100.5);

    expect(value.toString()).toBe("100.5");
    expect(value.valueOf()).toBe(100.5);
    expect(JSON.stringify(value)).toBe("100.5");
  });
});
