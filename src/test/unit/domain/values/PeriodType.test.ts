import { describe, it, expect } from "vitest";
import { PeriodType } from "@domain/value/PeriodType";

describe("PeriodType", () => {
  it("should have correct enum values", () => {
    expect(PeriodType.DAILY).toBe("daily");
    expect(PeriodType.WEEKLY).toBe("weekly");
    expect(PeriodType.MONTHLY).toBe("monthly");
  });

  it("should contain all expected period types", () => {
    const values = Object.values(PeriodType);
    expect(values).toHaveLength(3);
    expect(values).toContain("daily");
    expect(values).toContain("weekly");
    expect(values).toContain("monthly");
  });
});
