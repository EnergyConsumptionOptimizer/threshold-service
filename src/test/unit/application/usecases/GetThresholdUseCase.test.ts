import { describe, it, expect, beforeEach } from "vitest";
import { GetThresholdUseCase } from "@application/usecases/GetThresholdUseCase";
import { InMemoryThresholdRepository } from "../../../utils/InMemoryThresholdRepository";
import { Threshold } from "@domain/Threshold";
import { ResourceType } from "@domain/value/ResourceType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdId } from "@domain/value/ThresholdId";

describe("GetThresholdUseCase", () => {
  let useCase: GetThresholdUseCase;
  let repository: InMemoryThresholdRepository;

  beforeEach(() => {
    repository = new InMemoryThresholdRepository();
    useCase = new GetThresholdUseCase(repository);
  });

  it("should return threshold when exists", async () => {
    const threshold = Threshold.create({
      resourceType: ResourceType.ELECTRICITY,
      periodType: PeriodType.DAILY,
      thresholdType: ThresholdType.ACTUAL,
      value: 100,
    });
    await repository.save(threshold);

    const result = await useCase.executeById(threshold.id);

    expect(result).toBeDefined();
    expect(result.id.value).toBe(threshold.id.value);
  });

  it("should throw ThresholdNotFoundError when not exists", async () => {
    await expect(
      useCase.executeById(
        ThresholdId.of("123e4567-e89b-12d3-a456-426614174444"),
      ),
    ).rejects.toThrow("Threshold not found");
  });
});
