import { describe, expect, it } from "vitest";
import { ThresholdId } from "@domain/value/ThresholdId";
import { Threshold } from "@domain/Threshold";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { ThresholdType } from "@domain/value/ThresholdType";
import { PeriodType } from "@domain/value/PeriodType";
import {
  toThresholdDTO,
  toThresholdDTOs,
} from "@presentation/mappers/thresholdDTO";
import { ThresholdState } from "@domain/value/ThresholdState";

describe("Threshold HTTP DTO Mapper", () => {
  const mockThreshold = Threshold.create(
    ThresholdId.of("123"),
    UtilityType.GAS,
    ThresholdValue.of(10),
    ThresholdType.FORECAST,
    ThresholdState.ENABLED,
    PeriodType.ONE_DAY,
  );

  it("toThresholdDTO converts domain to HTTP DTO", () => {
    const dto = toThresholdDTO(mockThreshold);
    expect(dto).toEqual({
      id: "123",
      utilityType: "GAS",
      thresholdType: "FORECAST",
      periodType: "ONE_DAY",
      value: 10,
      thresholdState: "ENABLED",
    });
  });

  it("toThresholdDTOs converts array of domain objects to HTTP DTOs", () => {
    const dtos = toThresholdDTOs([mockThreshold]);
    expect(dtos).toHaveLength(1);
    expect(dtos[0].id).toBe("123");
  });
});
