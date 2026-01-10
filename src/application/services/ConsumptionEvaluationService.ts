import type { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import type { Threshold } from "@domain/Threshold";
import type { ThresholdBreachNotificationPort } from "@domain/port/ThresholdBreachNotificationPort";
import type { ConsumptionInfo } from "@domain/port/ThresholdBreachNotificationPort";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdState } from "@domain/value/ThresholdState";

/** Describe a consumption sample to be evaluated against thresholds. */
export interface ConsumptionParams {
  utilityType: UtilityType;
  thresholdType: ThresholdType;
  periodType?: PeriodType;
  value: number;
}

/** Evaluate consumption against active thresholds and optionally emit breach notifications. */
export class ConsumptionEvaluationService {
  constructor(
    private readonly repository: ThresholdRepositoryPort,
    private readonly notificationPort?: ThresholdBreachNotificationPort,
  ) {}

  /**
   * Evaluate a single sample.
   * @returns The thresholds breached by the sample.
   */
  async evaluateConsumption(
    consumption: ConsumptionParams,
  ): Promise<Threshold[]> {
    const activeThresholds = await this.fetchActiveThresholds(consumption);
    const breachedThresholds = this.detectBreaches(
      activeThresholds,
      consumption.value,
    );

    if (breachedThresholds.length > 0) {
      await this.processBreaches(breachedThresholds, consumption);
    }

    return breachedThresholds;
  }

  /**
   * Evaluate multiple samples.
   * @returns The breached thresholds across all samples.
   */
  async evaluateBatch(consumptions: ConsumptionParams[]): Promise<Threshold[]> {
    const results = await Promise.all(
      consumptions.map((c) => this.evaluateConsumption(c)),
    );
    return results.flat();
  }

  private async fetchActiveThresholds(
    consumption: ConsumptionParams,
  ): Promise<Threshold[]> {
    const periodType =
      consumption.thresholdType === ThresholdType.ACTUAL
        ? undefined
        : consumption.periodType;

    const thresholds = await this.repository.findByFilters({
      utilityType: consumption.utilityType,
      periodType: periodType,
      thresholdType: consumption.thresholdType,
    });

    return thresholds.filter(
      (t) => t.thresholdState === ThresholdState.ENABLED,
    );
  }

  private detectBreaches(thresholds: Threshold[], value: number): Threshold[] {
    return thresholds
      .map((t) => t.check(value))
      .filter((t) => t.thresholdState === ThresholdState.BREACHED);
  }

  private async processBreaches(
    breachedThresholds: Threshold[],
    consumption: ConsumptionParams,
  ): Promise<void> {
    await Promise.all(
      breachedThresholds.map((t) => this.repository.update(t.id, t)),
    );

    if (this.notificationPort) {
      await this.notificationPort.notifyThresholdsBreach(
        this.toConsumptionInfo(consumption),
        breachedThresholds,
      );
    }
  }

  private toConsumptionInfo(consumption: ConsumptionParams): ConsumptionInfo {
    return {
      utilityType: consumption.utilityType,
      thresholdType: consumption.thresholdType,
      periodType: consumption.periodType,
      value: consumption.value,
    };
  }
}
