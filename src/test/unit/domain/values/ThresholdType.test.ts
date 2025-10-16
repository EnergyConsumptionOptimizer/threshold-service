import { describe, expect, it } from "vitest";
import { ThresholdType } from "src/domain/value/ThresholdType";

describe("ThresholdType", () => {
  it("should have correct enum values", () => {
    expect(ThresholdType.ACTUAL).toBe("ACTUAL");
    expect(ThresholdType.HISTORICAL).toBe("HISTORICAL");
    expect(ThresholdType.FORECAST).toBe("FORECAST");
  });
});
