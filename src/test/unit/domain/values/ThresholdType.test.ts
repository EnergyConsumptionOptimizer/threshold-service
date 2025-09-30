import { describe, it, expect } from "vitest";
import { ThresholdType } from "@domain/value/ThresholdType";

describe("ThresholdType", () => {
  it("should have correct enum values", () => {
    expect(ThresholdType.ACTUAL).toBe("actual");
    expect(ThresholdType.FORECAST).toBe("forecast");
  });

  it("should contain all expected threshold types", () => {
    const values = Object.values(ThresholdType);
    expect(values).toHaveLength(2);
    expect(values).toContain("actual");
    expect(values).toContain("forecast");
  });
});
