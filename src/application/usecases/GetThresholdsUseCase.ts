import { ThresholdType } from "@domain/value/ThresholdType";
import { ResourceType } from "@domain/value/ResourceType";
import { PeriodType } from "@domain/value/PeriodType";
import { Threshold } from "@domain/Threshold";
import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";

export class GetThresholdsUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  public async execute(
    resourceType?: ResourceType,
    periodType?: PeriodType,
    thresholdType?: ThresholdType,
  ): Promise<Threshold[]> {
    const hasFilters = resourceType || periodType || thresholdType;
    return hasFilters
      ? this.repository.findByFilters(resourceType, periodType, thresholdType)
      : this.repository.findAll();
  }
}
