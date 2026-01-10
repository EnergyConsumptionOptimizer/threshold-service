import type { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import type { ThresholdId } from "@domain/value/ThresholdId";

/** Delete a threshold by ID. */
export class DeleteThresholdUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  /** Delete a threshold. */
  async execute(id: ThresholdId): Promise<void> {
    await this.repository.delete(id);
  }
}
