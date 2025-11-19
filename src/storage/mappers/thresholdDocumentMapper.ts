import { Threshold } from "@domain/Threshold";
import { ThresholdId } from "@domain/value/ThresholdId";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdState } from "@domain/value/ThresholdState";

export interface ThresholdDoc {
  _id: string;
  utilityType: string;
  thresholdType: string;
  periodType?: string;
  value: number;
  thresholdState: string;
}

export function toPersistence(threshold: Threshold) {
  return {
    utilityType: threshold.utilityType,
    thresholdType: threshold.thresholdType,
    periodType: threshold.periodType,
    value: threshold.value.valueOf(),
    thresholdState: threshold.thresholdState,
  };
}

export function toDomain(doc: ThresholdDoc): Threshold {
  return Threshold.create(
    ThresholdId.of(doc._id),
    doc.utilityType as UtilityType,
    ThresholdValue.of(doc.value),
    doc.thresholdType as ThresholdType,
    doc.thresholdState as ThresholdState,
    doc.periodType as PeriodType | undefined,
  );
}
