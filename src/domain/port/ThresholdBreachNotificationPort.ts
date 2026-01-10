import type { Threshold } from "@domain/Threshold";

/** Carries the consumption sample used to evaluate thresholds. */
export interface ConsumptionInfo {
  utilityType: string;
  thresholdType: string;
  periodType?: string;
  value: number;
}

/** Notifies external systems about one or more breached thresholds. */
export interface ThresholdBreachNotificationPort {
  notifyThresholdsBreach(
    consumption: ConsumptionInfo,
    breachedThresholds: Threshold[],
  ): Promise<void>;
}
