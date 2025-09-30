import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryThresholdRepository } from "../../../utils/InMemoryThresholdRepository";
import { UpdateThresholdUseCase } from "@application/usecases/UpdateThresholdUseCase";
import { Threshold } from "@domain/Threshold";
import { ResourceType } from "@domain/value/ResourceType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdId } from "@domain/value/ThresholdId";

describe("UpdateThresholdUseCase", () => {
  let useCase: UpdateThresholdUseCase;
  let repository: InMemoryThresholdRepository;

  beforeEach(() => {
    repository = new InMemoryThresholdRepository();
    useCase = new UpdateThresholdUseCase(repository);
  });

  it("should update existing threshold", async () => {
    const threshold = Threshold.create({
      resourceType: ResourceType.ELECTRICITY,
      periodType: PeriodType.DAILY,
      thresholdType: ThresholdType.ACTUAL,
      value: 100,
    });
    await repository.save(threshold);

    const updated = await useCase.executeById(threshold.id, 200);

    expect(updated).toBeDefined();
    expect(updated.value.value).toBe(200);
  });

  it("should throw ThresholdNotFoundError when threshold not found", async () => {
    await expect(
      useCase.executeById(
        ThresholdId.of("123e4567-e89b-12d3-a456-426614174444"),
        100,
      ),
    ).rejects.toThrow("Threshold not found");
  });
  it("should validate positive value", async () => {
    const threshold = Threshold.create({
      resourceType: ResourceType.ELECTRICITY,
      periodType: PeriodType.DAILY,
      thresholdType: ThresholdType.ACTUAL,
      value: 100,
    });
    await repository.save(threshold);

    await expect(useCase.executeById(threshold.id, 0)).rejects.toThrow();
  });
});
