import { describe, expect, it } from "vitest";
import { PeriodType } from "@domain/value/PeriodType";

describe("PeriodType", () => {
  it("should have correct enum values", () => {
    expect(PeriodType.ONE_DAY).toBe("ONE_DAY");
    expect(PeriodType.ONE_WEEK).toBe("ONE_WEEK");
    expect(PeriodType.ONE_MONTH).toBe("ONE_MONTH");
  });
});
