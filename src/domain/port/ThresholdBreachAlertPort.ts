import type { Threshold } from "@domain/Threshold";

/** Emits a single breach alert for a threshold evaluation. */
export interface ThresholdBreachAlertPort {
  notifyBreach(threshold: Threshold, currentValue: number): Promise<void>;
}
