import type { Threshold } from "@domain/Threshold";

/** Publishes threshold state changes to interested consumers (e.g. websocket clients). */
export interface ThresholdNotificationPort {
  notifyThresholdsChange(thresholds: Threshold[]): Promise<void>;

  connect(): Promise<void>;

  disconnect(): Promise<void>;
}
