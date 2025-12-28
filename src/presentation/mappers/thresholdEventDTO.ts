import type { Threshold } from "@domain/Threshold";

export interface ThresholdEventDTO {
  id: string;
  name: string;
  utilityType: string;
  thresholdType: string;
  thresholdState: string;
  value: number;
  periodType?: string;
}

export function toThresholdEventDTO(threshold: Threshold): ThresholdEventDTO {
  return {
    id: threshold.id.value,
    name: threshold.name.toString(),
    utilityType: threshold.utilityType,
    thresholdType: threshold.thresholdType,
    thresholdState: threshold.thresholdState,
    value: threshold.value.valueOf(),
    periodType: threshold.periodType,
  };
}

export function mapToThresholdEvents(
  thresholds: readonly Threshold[],
): ThresholdEventDTO[] {
  return thresholds.map(toThresholdEventDTO);
}
