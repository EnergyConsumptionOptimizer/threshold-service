import { Threshold } from "../Threshold";
import { ThresholdId } from "../value/ThresholdId";
import { ResourceType } from "../value/ResourceType";
import { PeriodType } from "../value/PeriodType";
import { ThresholdType } from "../value/ThresholdType";

export interface ThresholdRepositoryPort {
  findById(id: ThresholdId): Promise<Threshold | undefined>;

  findByBusinessKey(businessKey: string): Promise<Threshold | undefined>;

  findAll(): Promise<Threshold[]>;

  findByFilters(
    resourceType?: ResourceType,
    periodType?: PeriodType,
    thresholdType?: ThresholdType,
  ): Promise<Threshold[]>;

  save(threshold: Threshold): Promise<void>;

  delete(threshold: Threshold): Promise<void>;
}
