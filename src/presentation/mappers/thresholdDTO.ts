import { Threshold } from "@domain/Threshold";

export interface ThresholdDTO {
  id: string;
  resourceType: string;
  periodType: string;
  thresholdType: string;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export const thresholdDTOMapper = {
  toDTO(threshold: Threshold): ThresholdDTO {
    return {
      id: threshold.id.value,
      resourceType: threshold.resourceType,
      periodType: threshold.periodType,
      thresholdType: threshold.thresholdType,
      value: threshold.value.value,
      createdAt: threshold.createdAt.toISOString(),
      updatedAt: threshold.updatedAt.toISOString(),
    };
  },

  toDTOs(thresholds: readonly Threshold[]): ThresholdDTO[] {
    return thresholds.map(this.toDTO);
  },
};
