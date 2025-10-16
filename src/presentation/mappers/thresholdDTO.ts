import { Threshold } from "@domain/Threshold";
import { ThresholdId } from "@domain/value/ThresholdId";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { PeriodType } from "@domain/value/PeriodType";

export interface ThresholdDTO {
  id: string;
  utilityType: string;
  thresholdType: string;
  periodType?: string;
  value: number;
  isActive: boolean;
}

export interface ThresholdDoc {
  _id: string;
  utilityType: string;
  thresholdType: string;
  periodType?: string;
  value: number;
  isActive: boolean;
}

export const thresholdMapper = {
  toDTO(threshold: Threshold): ThresholdDTO {
    return {
      id: threshold.id.value,
      utilityType: threshold.utilityType,
      thresholdType: threshold.thresholdType,
      periodType: threshold.periodType,
      value: threshold.value.toPrimitive(),
      isActive: threshold.isActive,
    };
  },

  toDTOs(thresholds: readonly Threshold[]): ThresholdDTO[] {
    return thresholds.map((t) => this.toDTO(t));
  },

  toPersistence(threshold: Threshold) {
    return {
      utilityType: threshold.utilityType,
      thresholdType: threshold.thresholdType,
      periodType: threshold.periodType,
      value: threshold.value.toPrimitive(),
      isActive: threshold.isActive,
    };
  },

  toDomain(doc: ThresholdDoc): Threshold {
    return Threshold.create(
      ThresholdId.of(doc._id),
      UtilityType[doc.utilityType as keyof typeof UtilityType],
      ThresholdValue.of(doc.value),
      ThresholdType[doc.thresholdType as keyof typeof ThresholdType],
      doc.isActive,
      doc.periodType
        ? PeriodType[doc.periodType as keyof typeof PeriodType]
        : undefined,
    );
  },
};
