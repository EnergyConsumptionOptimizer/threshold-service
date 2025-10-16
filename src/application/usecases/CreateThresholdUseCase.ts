import { PeriodType } from "@domain/value/PeriodType";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { Threshold } from "@domain/Threshold";
import { ThresholdId } from "@domain/value/ThresholdId";
import { ThresholdValue } from "@domain/value/ThresholdValue";

export class CreateThresholdUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  public async save(
    utilityType: UtilityType,
    thresholdType: ThresholdType,
    value: ThresholdValue,
    isActive: boolean,
    periodType?: PeriodType,
  ): Promise<Threshold> {
    const threshold = Threshold.create(
      ThresholdId.of("id-placeholder"),
      utilityType,
      value,
      thresholdType,
      isActive,
      periodType,
    );
    return this.repository.save(threshold);
  }
}
