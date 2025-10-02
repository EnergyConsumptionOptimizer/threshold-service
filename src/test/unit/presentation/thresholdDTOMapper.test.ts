import { describe, it, expect } from "vitest";
import { Threshold } from "@domain/Threshold";
import { ResourceType } from "@domain/value/ResourceType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { thresholdDTOMapper } from "@presentation/mappers/thresholdDTO";

describe("thresholdDTOMapper", () => {
  const baseThresholdParams = {
    resourceType: ResourceType.ELECTRICITY,
    periodType: PeriodType.DAILY,
    thresholdType: ThresholdType.ACTUAL,
    value: 100,
  };

  it("toDTO should map Threshold to DTO correctly", () => {
    const threshold = Threshold.create(baseThresholdParams);
    const dto = thresholdDTOMapper.toDTO(threshold);

    expect(dto).toEqual({
      id: threshold.id.value,
      resourceType: ResourceType.ELECTRICITY,
      periodType: PeriodType.DAILY,
      thresholdType: ThresholdType.ACTUAL,
      value: 100,
      createdAt: threshold.createdAt.toISOString(),
      updatedAt: threshold.updatedAt.toISOString(),
    });
  });

  it("toDTOs should map array of Thresholds to array of DTOs", () => {
    const threshold1 = Threshold.create(baseThresholdParams);
    const threshold2 = Threshold.create({ ...baseThresholdParams, value: 200 });
    const dtos = thresholdDTOMapper.toDTOs([threshold1, threshold2]);

    expect(dtos).toHaveLength(2);
    expect(dtos[0].value).toBe(100);
    expect(dtos[1].value).toBe(200);
  });
});
