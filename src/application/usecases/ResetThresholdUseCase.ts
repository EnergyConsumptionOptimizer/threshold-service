import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { Threshold } from "@domain/Threshold";
import { ThresholdState } from "@domain/value/ThresholdState";

export class ResetThresholdUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  public async reset(): Promise<Threshold[]> {
    const now = new Date();
    const thresholds = await this.repository.findAll();
    const toReset: Threshold[] = thresholds.filter(
      (t) =>
        t.thresholdState === ThresholdState.BREACHED &&
        this.shouldReset(t, now),
    );

    const resetThresholds = toReset.map((t) =>
      t.update({ thresholdState: ThresholdState.ENABLED }),
    );
    await Promise.all(
      resetThresholds.map((t) => this.repository.update(t.id, t)),
    );
    return resetThresholds;
  }

  private shouldReset(threshold: Threshold, now: Date): boolean {
    const period = threshold.periodType;
    if (!period) return false;

    const day = now.getDay();
    const date = now.getDate();

    switch (period) {
      case PeriodType.ONE_DAY:
        return true;

      case PeriodType.ONE_WEEK:
        return day === 1;

      case PeriodType.ONE_MONTH:
        return date === 1;

      default:
        return false;
    }
  }
}
