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
    const breaches = activeThresholds
      .map((t) => t.check(params.value))
      .filter((t) => t.thresholdState === ThresholdState.BREACHED);

    if (breaches.length > 0) {
      await this.handleBreaches(breaches, params);
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
    params: ConsumptionParams,
  ): Promise<void> {
    await Promise.all(breaches.map((t) => this.repository.update(t.id, t)));
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
