import type { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import type { ThresholdFilters } from "@domain/port/ThresholdRepositoryPort";
import type { Threshold } from "@domain/Threshold";

/** List thresholds matching the provided filters. */
export class ListThresholdsUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  /**
   * List thresholds.
   * @returns The matching thresholds.
   */
  async execute(filters: ThresholdFilters): Promise<Threshold[]> {
    return this.repository.findByFilters(filters);
  }
}
