import { PeriodType } from "@domain/value/PeriodType";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { Threshold } from "@domain/Threshold";
import { ThresholdId } from "@domain/value/ThresholdId";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { ThresholdState } from "@domain/value/ThresholdState";

export class CreateThresholdUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  public async save(
    utilityType: UtilityType,
    thresholdType: ThresholdType,
    value: ThresholdValue,
    state: ThresholdState,
    periodType?: PeriodType,
  ): Promise<Threshold> {
    const threshold = Threshold.create(
      ThresholdId.of("id-placeholder"),
      utilityType,
      value,
      thresholdType,
      state,
      periodType,
    );
    return this.repository.save(threshold);
  }
}
