import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { ThresholdId } from "@domain/value/ThresholdId";
import { ThresholdType } from "@domain/value/ThresholdType";
import { PeriodType } from "@domain/value/PeriodType";
import {
  ActualThresholdWithPeriodError,
  MissingPeriodTypeForThresholdError,
} from "@domain/errors";
import { ThresholdState } from "@domain/value/ThresholdState";

export class Threshold {
  private constructor(
    public readonly id: ThresholdId,
    public readonly utilityType: UtilityType,
    public readonly value: ThresholdValue,
    public readonly thresholdType: ThresholdType,
    public readonly thresholdState: ThresholdState,
    public readonly periodType?: PeriodType,
  ) {
    this.validate();
  }
  private validate(): void {
    if (this.thresholdType === ThresholdType.ACTUAL && this.periodType) {
      throw new ActualThresholdWithPeriodError();
    }

    const requiresPeriod = [
      ThresholdType.HISTORICAL,
      ThresholdType.FORECAST,
    ].includes(this.thresholdType);
    if (requiresPeriod && !this.periodType) {
      throw new MissingPeriodTypeForThresholdError(this.thresholdType);
    }
  }

  static create(
    id: ThresholdId,
    utilityType: UtilityType,
    value: ThresholdValue,
    type: ThresholdType,
    state = ThresholdState.ENABLED,
    periodType?: PeriodType,
  ): Threshold {
    return new Threshold(id, utilityType, value, type, state, periodType);
  }

  update(attrs: Partial<Threshold>): Threshold {
    return Threshold.create(
      this.id,
      attrs.utilityType ?? this.utilityType,
      attrs.value ?? this.value,
      attrs.thresholdType ?? this.thresholdType,
      attrs.thresholdState ?? this.thresholdState,
      attrs.periodType ?? this.periodType,
    );
  }

  public check(input: number): Threshold {
    if (this.thresholdState === ThresholdState.DISABLED) {
      return this;
    }

    const breached = this.value.isBreachedBy(input);
    if (breached) {
      return this.setState(ThresholdState.BREACHED);
    }
    return this;
  }

  public setState(state: ThresholdState): Threshold {
    return this.update({ thresholdState: state });
  }
}
