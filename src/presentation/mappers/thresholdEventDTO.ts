import type { Threshold } from "@domain/Threshold";

/** Defines the payload emitted when threshold state changes are published. */
export interface ThresholdEventDTO {
  thresholdId: string;
  thresholdName: string;
  utilityType: string;
  thresholdType: string;
  value: number;
  periodType?: string;
}

/**
 * Map a domain threshold to an event payload.
 * @returns The mapped event.
 */
export function toThresholdEventDTO(threshold: Threshold): ThresholdEventDTO {
  return {
    thresholdId: threshold.id.value,
    thresholdName: threshold.name.toString(),
    utilityType: threshold.utilityType,
    thresholdType: threshold.thresholdType,
    periodType: threshold.periodType,
    value: threshold.value.valueOf(),
  };
}

/**
 * Map multiple domain thresholds to event payloads.
 * @returns The mapped event list.
 */
export function mapToThresholdEvents(
  thresholds: readonly Threshold[],
): ThresholdEventDTO[] {
  return thresholds.map(toThresholdEventDTO);
}
