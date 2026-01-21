import type { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import type { Threshold } from "@domain/Threshold";
import type {
  ThresholdBreachNotificationPort,
  ConsumptionInfo,
} from "@domain/port/ThresholdBreachNotificationPort";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdState } from "@domain/value/ThresholdState";

export interface ConsumptionParams {
  utilityType: UtilityType;
  thresholdType: ThresholdType;
  periodType?: PeriodType;
  value: number;
}

export interface UtilityReadings {
  electricity?: { value: number };
  water?: { value: number };
  gas?: { value: number };
}

export interface EvaluationContext {
  thresholdType: ThresholdType;
  periodType?: PeriodType;
}

export class ConsumptionEvaluationService {
  private readonly utilityMap: Record<string, UtilityType> = {
    electricity: UtilityType.ELECTRICITY,
    water: UtilityType.WATER,
    gas: UtilityType.GAS,
  };

  constructor(
    private readonly repository: ThresholdRepositoryPort,
    private readonly notificationPort?: ThresholdBreachNotificationPort,
  ) {}

  async processReadings(
    readings: UtilityReadings,
    context: EvaluationContext,
  ): Promise<void> {
    const evaluations: Promise<Threshold[]>[] = [];

    for (const [key, data] of Object.entries(readings)) {
      if (key in this.utilityMap && data) {
        evaluations.push(
          this.evaluate({
            utilityType: this.utilityMap[key],
            thresholdType: context.thresholdType,
            periodType: context.periodType,
            value: data.value,
          }),
        );
      }
    }

    const results = await Promise.allSettled(evaluations);

    results.forEach((res) => {
      if (res.status === "rejected") {
        console.error("Evaluation failed:", res.reason);
      }
    });
  }

  async evaluate(params: ConsumptionParams): Promise<Threshold[]> {
    const activeThresholds = await this.fetchActiveThresholds(params);
    const breaches: Threshold[] = [];
    const thresholdsToPersist: Threshold[] = [];

    for (const threshold of activeThresholds) {
      const checkedThreshold = threshold.check(params.value);

      // 1. HISTORICAL / FORECAST: Logic handled by Threshold.check() -> transitions to BREACHED
      const isStateChangedBreach =
        checkedThreshold.thresholdState === ThresholdState.BREACHED;

      // 2. ACTUAL: State stays ENABLED, but we detect breach via value check
      const isActualBreach =
        threshold.thresholdType === ThresholdType.ACTUAL &&
        threshold.value.isBreachedBy(params.value);

      if (isStateChangedBreach) {
        breaches.push(checkedThreshold);
        thresholdsToPersist.push(checkedThreshold);
      } else if (isActualBreach) {
        breaches.push(checkedThreshold);
        // Do NOT persist ACTUAL thresholds (state must never change)
      }
    }

    if (breaches.length > 0) {
      await this.handleBreaches(breaches, thresholdsToPersist, params);
    }

    return breaches;
  }

  async evaluateBatch(consumptions: ConsumptionParams[]): Promise<Threshold[]> {
    const results = await Promise.all(
      consumptions.map((c) => this.evaluate(c)),
    );
    return results.flat();
  }

  private async fetchActiveThresholds(
    params: ConsumptionParams,
  ): Promise<Threshold[]> {
    const periodType =
      params.thresholdType === ThresholdType.ACTUAL
        ? undefined
        : params.periodType;
    return (
      await this.repository.findByFilters({
        utilityType: params.utilityType,
        periodType,
        thresholdType: params.thresholdType,
      })
    ).filter((t) => t.thresholdState === ThresholdState.ENABLED);
  }

  private async handleBreaches(
    breaches: Threshold[],
    toPersist: Threshold[],
    params: ConsumptionParams,
  ): Promise<void> {
    if (toPersist.length > 0) {
      await Promise.all(toPersist.map((t) => this.repository.update(t.id, t)));
    }

    if (this.notificationPort) {
      await this.notificationPort.notifyThresholdsBreach(
        this.mapToInfo(params),
        breaches,
      );
    }
  }

  private mapToInfo(params: ConsumptionParams): ConsumptionInfo {
    return {
      utilityType: params.utilityType,
      thresholdType: params.thresholdType,
      periodType: params.periodType,
      value: params.value,
    };
  }
}
