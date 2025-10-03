import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { ThresholdId } from "@domain/value/ThresholdId";
import { ThresholdNotFoundError } from "@domain/errors";

export class DeleteThresholdUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  public async execute(id: ThresholdId): Promise<void> {
    const threshold = await this.repository.findById(id);
    if (!threshold) {
      throw new ThresholdNotFoundError(id.value);
    }

    await this.repository.delete(threshold);
  }
}
