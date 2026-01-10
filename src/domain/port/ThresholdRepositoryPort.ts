import { Threshold } from "../Threshold";
import { ThresholdId } from "../value/ThresholdId";
import { UtilityType } from "../value/UtilityType";
import { PeriodType } from "../value/PeriodType";
import { ThresholdType } from "../value/ThresholdType";
import { ThresholdState } from "@domain/value/ThresholdState";
import { ThresholdName } from "@domain/value/ThresholdName";

/** Defines optional criteria for querying thresholds. */
export interface ThresholdFilters {
  name?: ThresholdName;
  utilityType?: UtilityType;
  periodType?: PeriodType;
  thresholdType?: ThresholdType;
  state?: ThresholdState;
}

/**
 * Abstracts persistence operations for thresholds.
 *
 */
export interface ThresholdRepositoryPort {
  findById(thresholdId: ThresholdId): Promise<Threshold | null>;

  findAll(): Promise<Threshold[]>;

  findByFilters(filters: ThresholdFilters): Promise<Threshold[]>;

  save(threshold: Threshold): Promise<Threshold>;

  delete(thresholdId: ThresholdId): Promise<void>;

  update(
    thresholdId: ThresholdId,
    attrs: Partial<Threshold>,
  ): Promise<Threshold | null>;
}
