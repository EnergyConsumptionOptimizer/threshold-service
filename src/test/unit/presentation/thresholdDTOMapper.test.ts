import { describe, expect, it } from "vitest";
import { ThresholdId } from "@domain/value/ThresholdId";
import { Threshold } from "@domain/Threshold";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { ThresholdType } from "@domain/value/ThresholdType";
import { PeriodType } from "@domain/value/PeriodType";
import { thresholdMapper } from "@presentation/mappers/thresholdDTO";
import { ThresholdState } from "@domain/value/ThresholdState";

describe("thresholdMapper", () => {
  const mockThreshold = Threshold.create(
    ThresholdId.of("123"),
    UtilityType.GAS,
    ThresholdValue.of(10),
    ThresholdType.FORECAST,
    ThresholdState.ENABLED,
    PeriodType.ONE_DAY,
  );

  const rawDoc = {
    _id: "123",
    utilityType: "GAS",
    thresholdType: "FORECAST",
    periodType: "ONE_DAY",
    value: 10,
    thresholdState: "ENABLED",
  };

  it("toDTO converts domain to DTO", () => {
    const dto = thresholdMapper.toDTO(mockThreshold);
    expect(dto).toEqual({
      id: "123",
      utilityType: "GAS",
      thresholdType: "FORECAST",
      periodType: "ONE_DAY",
      value: 10,
      thresholdState: "ENABLED",
    });
  });

  it("toDTOs converts array of domain objects to DTOs", () => {
    const dtos = thresholdMapper.toDTOs([mockThreshold]);
    expect(dtos).toHaveLength(1);
    expect(dtos[0].id).toBe("123");
  });

  it("toPersistence converts domain to persistence object", () => {
    const persistence = thresholdMapper.toPersistence(mockThreshold);
    expect(persistence).toEqual({
      utilityType: "GAS",
      thresholdType: "FORECAST",
      periodType: "ONE_DAY",
      value: 10,
      thresholdState: "ENABLED",
    });
  });

  it("toDomain converts raw object to Threshold domain", () => {
    const domain = thresholdMapper.toDomain(rawDoc);
    expect(domain.id.value).toBe("123");
    expect(domain.utilityType).toBe("GAS");
    expect(domain.value.toPrimitive()).toBe(10);
    expect(domain.thresholdType).toBe("FORECAST");
    expect(domain.periodType).toBe("ONE_DAY");
    expect(domain.thresholdState).toBe("ENABLED");
  });
});
