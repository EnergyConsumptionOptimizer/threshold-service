import type { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import type { Threshold } from "@domain/Threshold";
import type { ThresholdId } from "@domain/value/ThresholdId";

/** Apply partial updates to an existing threshold. */
export class UpdateThresholdUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  /**
   * Apply a partial update.
   * @param updates - Fields to override.
   * @returns The updated threshold, or null when missing.
   */
  async execute(
    id: ThresholdId,
    updates: Partial<Threshold>,
  ): Promise<Threshold | null> {
    return this.repository.update(id, updates);
  }
}
