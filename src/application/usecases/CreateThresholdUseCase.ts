import { PeriodType } from "@domain/value/PeriodType";
import { ResourceType } from "@domain/value/ResourceType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { Threshold } from "@domain/Threshold";
import { ThresholdAlreadyExistsError } from "@application/errors";

export class CreateThresholdUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  public async execute(
    resourceType: ResourceType,
    periodType: PeriodType,
    thresholdType: ThresholdType,
    value: number,
  ): Promise<Threshold> {
    const businessKey = Threshold.createBusinessKey(
      resourceType,
      periodType,
      thresholdType,
    );
    const existing = await this.repository.findByBusinessKey(businessKey);
    if (existing) {
      throw new ThresholdAlreadyExistsError(businessKey);
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
