import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryThresholdRepository } from "../../../utils/InMemoryThresholdRepository";
import { DeleteThresholdUseCase } from "@application/usecases/DeleteThresholdUseCase";
import { Threshold } from "@domain/Threshold";
import { ResourceType } from "@domain/value/ResourceType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdId } from "@domain/value/ThresholdId";

describe("DeleteThresholdUseCase", () => {
  let useCase: DeleteThresholdUseCase;
  let repository: InMemoryThresholdRepository;

  beforeEach(() => {
    repository = new InMemoryThresholdRepository();
    useCase = new DeleteThresholdUseCase(repository);
  });

  it("should delete existing threshold", async () => {
    const threshold = Threshold.create({
      resourceType: ResourceType.ELECTRICITY,
      periodType: PeriodType.DAILY,
      thresholdType: ThresholdType.ACTUAL,
      value: 100,
    });
    await repository.save(threshold);

    await expect(useCase.execute(threshold.id)).resolves.not.toThrow();

    expect(repository.getThresholdCount()).toBe(0);
  });

  it("should throw ThresholdNotFoundError when threshold not exists", async () => {
    await expect(
      useCase.execute(ThresholdId.of("123e4567-e89b-12d3-a456-426614174444")),
    ).rejects.toThrow("Threshold not found");
  });
});
