import { describe, it, expect, beforeEach } from "vitest";
import { CreateThresholdUseCase } from "@application/usecases/CreateThresholdUseCase";
import { InMemoryThresholdRepository } from "../../../utils/InMemoryThresholdRepository";
import { ResourceType } from "@domain/value/ResourceType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { InvalidThresholdValueError } from "@domain/errors";

describe("CreateThresholdUseCase", () => {
  let useCase: CreateThresholdUseCase;
  let repository: InMemoryThresholdRepository;

  beforeEach(() => {
    repository = new InMemoryThresholdRepository();
    useCase = new CreateThresholdUseCase(repository);
  });

  it("should create threshold when unique", async () => {
    const threshold = await useCase.execute(
      ResourceType.ELECTRICITY,
      PeriodType.DAILY,
      ThresholdType.ACTUAL,
      100,
    );

    expect(threshold).toBeDefined();
    expect(threshold.resourceType).toBe(ResourceType.ELECTRICITY);
    expect(threshold.value.value).toBe(100);
  });

  it("should throw ThresholdAlreadyExistsError when threshold already exists", async () => {
    await useCase.execute(
      ResourceType.ELECTRICITY,
      PeriodType.DAILY,
      ThresholdType.ACTUAL,
      100,
    );

    await expect(
      useCase.execute(
        ResourceType.ELECTRICITY,
        PeriodType.DAILY,
        ThresholdType.ACTUAL,
        100,
      ),
    ).rejects.toThrow("Threshold already exists");
  });
  it("should validate positive value", async () => {
    await expect(
      useCase.execute(
        ResourceType.ELECTRICITY,
        PeriodType.DAILY,
        ThresholdType.ACTUAL,
        0,
      ),
    ).rejects.toThrow(InvalidThresholdValueError);
  });
});
