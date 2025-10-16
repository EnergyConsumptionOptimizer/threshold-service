import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { Threshold } from "@domain/Threshold";
import { ThresholdId } from "@domain/value/ThresholdId";
import { UtilityType } from "@domain/value/UtilityType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";

export class GetThresholdUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  public async findById(id: ThresholdId): Promise<Threshold | null> {
    return this.repository.findById(id);
  }

  public async findByFilters(
    utilityType?: UtilityType,
    periodType?: PeriodType,
    thresholdType?: ThresholdType,
    isActive?: boolean,
  ): Promise<Threshold[]> {
    return this.repository.findByFilters(
      utilityType,
      periodType,
      thresholdType,
      isActive,
    );
  }

  public async findAll(): Promise<Threshold[]> {
    return this.repository.findAll();
  }
}
