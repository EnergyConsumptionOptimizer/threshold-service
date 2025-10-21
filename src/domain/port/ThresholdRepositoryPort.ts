import { Threshold } from "../Threshold";
import { ThresholdId } from "../value/ThresholdId";
import { UtilityType } from "../value/UtilityType";
import { PeriodType } from "../value/PeriodType";
import { ThresholdType } from "../value/ThresholdType";

export interface ThresholdRepositoryPort {
  findById(thresholdId: ThresholdId): Promise<Threshold | null>;

  findAll(): Promise<Threshold[]>;

  findByFilters(
    utilityType?: UtilityType,
    periodType?: PeriodType,
    thresholdType?: ThresholdType,
    isActive?: boolean,
  ): Promise<Threshold[]>;

  save(threshold: Threshold): Promise<Threshold>;

  delete(thresholdId: ThresholdId): Promise<void>;

  update(
    thresholdId: ThresholdId,
    attrs: Partial<Threshold>,
  ): Promise<Threshold | null>;
}
