import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryThresholdRepository } from "../../../utils/InMemoryThresholdRepository";
import { GetThresholdsUseCase } from "@application/usecases/GetThresholdsUseCase";
import { Threshold } from "@domain/Threshold";
import { ResourceType } from "@domain/value/ResourceType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";

describe("GetThresholdsUseCase", () => {
  let useCase: GetThresholdsUseCase;
  let repository: InMemoryThresholdRepository;

  beforeEach(() => {
    repository = new InMemoryThresholdRepository();
    useCase = new GetThresholdsUseCase(repository);
  });

  it("should return all thresholds without filters", async () => {
    const threshold1 = Threshold.create({
      resourceType: ResourceType.ELECTRICITY,
      periodType: PeriodType.DAILY,
      thresholdType: ThresholdType.ACTUAL,
      value: 100,
    });
    const threshold2 = Threshold.create({
      resourceType: ResourceType.GAS,
      periodType: PeriodType.MONTHLY,
      thresholdType: ThresholdType.FORECAST,
      value: 200,
    });

    await repository.save(threshold1);
    await repository.save(threshold2);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
  });

  it("should filter by resource type", async () => {
    const threshold1 = Threshold.create({
      resourceType: ResourceType.ELECTRICITY,
      periodType: PeriodType.DAILY,
      thresholdType: ThresholdType.ACTUAL,
      value: 100,
    });
    const threshold2 = Threshold.create({
      resourceType: ResourceType.GAS,
      periodType: PeriodType.DAILY,
      thresholdType: ThresholdType.ACTUAL,
      value: 200,
    });

    await repository.save(threshold1);
    await repository.save(threshold2);

    const result = await useCase.execute(ResourceType.ELECTRICITY);

    expect(result).toHaveLength(1);
    expect(result[0].resourceType).toBe(ResourceType.ELECTRICITY);
  });

  it("should return empty array when no matches", async () => {
    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
