import type { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import type { Threshold } from "@domain/Threshold";
import type { ThresholdId } from "@domain/value/ThresholdId";

/** Load a threshold by ID. */
export class GetThresholdByIdUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  /**
   * Get a threshold by ID.
   * @returns The threshold, or null when missing.
   */
  async execute(id: ThresholdId): Promise<Threshold | null> {
    return this.repository.findById(id);
  }
}
