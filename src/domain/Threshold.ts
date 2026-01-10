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
import { ThresholdName } from "@domain/value/ThresholdName";

/**
 * Represent an immutable threshold with domain invariants.
 */
export class Threshold {
  private constructor(
    public readonly id: ThresholdId,
    public readonly name: ThresholdName,
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

  /**
   * Create a threshold instance.
   * @param state - Defaults to ENABLED.
   * @param periodType - Required for HISTORICAL/FORECAST.
   * @returns The created threshold.
   */
  static create(
    id: ThresholdId,
    name: ThresholdName,
    utilityType: UtilityType,
    value: ThresholdValue,
    type: ThresholdType,
    state = ThresholdState.ENABLED,
    periodType?: PeriodType,
  ): Threshold {
    return new Threshold(id, name, utilityType, value, type, state, periodType);
  }

  /**
   * Apply a partial update.
   * @param attrs - Fields to override.
   * @returns The updated threshold.
   */
  update(attrs: Partial<Threshold>): Threshold {
    return Threshold.create(
      this.id,
      attrs.name ?? this.name,
      attrs.utilityType ?? this.utilityType,
      attrs.value ?? this.value,
      attrs.thresholdType ?? this.thresholdType,
      attrs.thresholdState ?? this.thresholdState,
      attrs.periodType ?? this.periodType,
    );
  }

  /**
   * Evaluate an input and mark the threshold as breached when enabled and exceeded.
   * @param input - Value to check.
   * @returns The updated threshold.
   */
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

  /**
   * Set the threshold state.
   * @returns The updated threshold.
   */
  public setState(state: ThresholdState): Threshold {
    return this.update({ thresholdState: state });
  }
}
