import { Threshold } from "@domain/Threshold";

/** Defines the HTTP-facing representation of a threshold. */
export interface ThresholdDTO {
  id: string;
  name: string;
  utilityType: string;
  thresholdType: string;
  periodType?: string;
  value: number;
  thresholdState: string;
}

/**
 * Map a domain threshold to a DTO.
 * @returns The mapped DTO.
 */
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

/**
 * Map multiple domain thresholds to DTOs.
 * @returns The mapped DTO list.
 */
export function toThresholdDTOs(
  thresholds: readonly Threshold[],
): ThresholdDTO[] {
  return thresholds.map(toThresholdDTO);
}
