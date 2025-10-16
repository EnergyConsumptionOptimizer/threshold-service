import { describe, expect, it } from "vitest";
import { Threshold } from "src/domain/Threshold";
import { ThresholdId } from "src/domain/value/ThresholdId";
import { ThresholdValue } from "src/domain/value/ThresholdValue";
import { thresholdMapper } from "src/presentation/mappers/thresholdDTO";
import { UtilityType } from "src/domain/value/UtilityType";
import { ThresholdType } from "src/domain/value/ThresholdType";
import { PeriodType } from "src/domain/value/PeriodType";

describe("thresholdMapper", () => {
  const mockThreshold = Threshold.create(
    ThresholdId.of("123"),
    UtilityType.GAS,
    ThresholdValue.of(10),
    ThresholdType.FORECAST,
    true,
    PeriodType.ONE_DAY,
  );

  const rawDoc = {
    _id: "123",
    utilityType: "GAS",
    thresholdType: "FORECAST",
    periodType: "ONE_DAY",
    value: 10,
    isActive: true,
  };

  it("toDTO converts domain to DTO", () => {
    const dto = thresholdMapper.toDTO(mockThreshold);
    expect(dto).toEqual({
      id: "123",
      utilityType: "GAS",
      thresholdType: "FORECAST",
      periodType: "ONE_DAY",
      value: 10,
      isActive: true,
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
      isActive: true,
    });
  });

  it("toDomain converts raw object to Threshold domain", () => {
    const domain = thresholdMapper.toDomain(rawDoc);
    expect(domain.id.value).toBe("123");
    expect(domain.utilityType).toBe("GAS");
    expect(domain.value.toPrimitive()).toBe(10);
    expect(domain.thresholdType).toBe("FORECAST");
    expect(domain.periodType).toBe("ONE_DAY");
    expect(domain.isActive).toBe(true);
  });
});
