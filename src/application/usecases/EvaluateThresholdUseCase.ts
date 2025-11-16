import { PeriodType } from "@domain/value/PeriodType";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { Threshold } from "@domain/Threshold";
import { ThresholdState } from "@domain/value/ThresholdState";

export class EvaluateThresholdUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  public async evaluate(
    utilityType: UtilityType,
    thresholdType: ThresholdType,
    value: number,
    periodType: PeriodType,
  ): Promise<Threshold[]> {
    const thresholds = await this.repository.findByFilters(
      utilityType,
      periodType,
      thresholdType,
    );

    const breachedThresholds = thresholds
      .filter((t) => t.thresholdState === ThresholdState.ENABLED)
      .map((t) => t.check(value))
      .filter((t) => t.thresholdState === ThresholdState.BREACHED);

    for (const t of breachedThresholds) {
      await this.repository.update(t.id, t);
    }

    return breachedThresholds;
  }
}
