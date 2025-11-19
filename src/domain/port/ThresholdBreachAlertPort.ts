import type { Threshold } from "@domain/Threshold";

export interface ThresholdBreachAlertPort {
  notifyBreach(threshold: Threshold, currentValue: number): Promise<void>;
}
