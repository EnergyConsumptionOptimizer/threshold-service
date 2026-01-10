import type { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import type { ThresholdIdGeneratorPort } from "@domain/port/ThresholdIdGeneratorPort";
import { Threshold } from "@domain/Threshold";
import { ThresholdName } from "@domain/value/ThresholdName";
import { ThresholdState } from "@domain/value/ThresholdState";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import type { PeriodType } from "@domain/value/PeriodType";
import type { ThresholdType } from "@domain/value/ThresholdType";
import type { UtilityType } from "@domain/value/UtilityType";

/** Capture user-provided input for threshold creation. */
export interface CreateThresholdCommand {
  name: string;
  utilityType: UtilityType;
  value: number;
  thresholdType: ThresholdType;
  thresholdState?: ThresholdState;
  periodType?: PeriodType;
}

/** Create and persist a new threshold from a command object. */
export class CreateThresholdUseCase {
  constructor(
    private readonly repository: ThresholdRepositoryPort,
    private readonly idGenerator: ThresholdIdGeneratorPort,
  ) {}

  /**
   * Create and persist a threshold.
   * @param command - Input for threshold creation.
   * @returns The persisted threshold.
   */
  async execute(command: CreateThresholdCommand): Promise<Threshold> {
    const threshold = Threshold.create(
      this.idGenerator.nextId(),
      ThresholdName.of(command.name),
      command.utilityType,
      ThresholdValue.of(command.value),
      command.thresholdType,
      command.thresholdState ?? ThresholdState.ENABLED,
      command.periodType,
    );

    return this.repository.save(threshold);
  }
}
