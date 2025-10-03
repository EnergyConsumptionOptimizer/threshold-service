import { PeriodType } from "@domain/value/PeriodType";
import { ResourceType } from "@domain/value/ResourceType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { Threshold } from "@domain/Threshold";
import { ThresholdAlreadyExistsError } from "@domain/errors";

export class CreateThresholdUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  public async execute(
    resourceType: ResourceType,
    periodType: PeriodType,
    thresholdType: ThresholdType,
    value: number,
  ): Promise<Threshold> {
    const existing = await this.repository.findByFilters(
      resourceType,
      periodType,
      thresholdType,
    );
    if (existing.length > 0) {
      throw new ThresholdAlreadyExistsError(
        Threshold.createBusinessKey(resourceType, periodType, thresholdType),
      );
    }

    const threshold = Threshold.create({
      resourceType,
      periodType,
      thresholdType,
      value,
    });
    await this.repository.save(threshold);
    return threshold;
  }
}
