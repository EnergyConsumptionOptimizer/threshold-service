import { Threshold } from "@domain/Threshold";

export interface ThresholdDTO {
  id: string;
  name: string;
  utilityType: string;
  thresholdType: string;
  periodType?: string;
  value: number;
  thresholdState: string;
}

export function toThresholdDTO(threshold: Threshold): ThresholdDTO {
  return {
    id: threshold.id.value,
    name: threshold.name.toString(),
    utilityType: threshold.utilityType,
    thresholdType: threshold.thresholdType,
    periodType: threshold.periodType,
    value: threshold.value.valueOf(),
    thresholdState: threshold.thresholdState,
  };
}

export function toThresholdDTOs(
  thresholds: readonly Threshold[],
): ThresholdDTO[] {
  return thresholds.map(toThresholdDTO);
}
