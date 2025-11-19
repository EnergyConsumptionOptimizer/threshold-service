import type { Threshold } from "@domain/Threshold";

export interface ThresholdNotificationPort {
  notifyThresholdsChange(thresholds: Threshold[]): Promise<void>;

  connect(): Promise<void>;

  disconnect(): Promise<void>;
}
