import type { Threshold } from "@domain/Threshold";

export interface ConsumptionInfo {
  utilityType: string;
  thresholdType: string;
  periodType?: string;
  value: number;
}

export interface ThresholdBreachNotificationPort {
  notifyThresholdsBreach(
    consumption: ConsumptionInfo,
    breachedThresholds: Threshold[],
  ): Promise<void>;
}
