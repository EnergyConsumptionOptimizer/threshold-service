import { describe, expect, it } from "vitest";
import { createThresholdSchema } from "src/presentation/schemas/thresholdSchemas";
import { UtilityType } from "src/domain/value/UtilityType";
import { ThresholdType } from "src/domain/value/ThresholdType";
import { PeriodType } from "src/domain/value/PeriodType";
import { ThresholdValue } from "src/domain/value/ThresholdValue";

describe("createThresholdSchema", () => {
  it("parses valid input", () => {
    const input = {
      utilityType: UtilityType.GAS,
      thresholdType: ThresholdType.FORECAST,
      isActive: true,
      value: 10,
      periodType: PeriodType.ONE_DAY,
    };

    const parsed = createThresholdSchema.parse(input);
    expect(parsed.value).toBeInstanceOf(ThresholdValue);
    expect(parsed.value.toPrimitive()).toBe(10);
  });

  it("rejects non-positive values", () => {
    const input = {
      utilityType: UtilityType.GAS,
      thresholdType: ThresholdType.FORECAST,
      isActive: true,
      value: 0,
    };
    expect(() => createThresholdSchema.parse(input)).toThrow();
  });

  it("allows optional periodType", () => {
    const input = {
      utilityType: UtilityType.GAS,
      thresholdType: ThresholdType.FORECAST,
      isActive: true,
      value: 5,
    };
    const parsed = createThresholdSchema.parse(input);
    expect(parsed.periodType).toBeUndefined();
  });
});
