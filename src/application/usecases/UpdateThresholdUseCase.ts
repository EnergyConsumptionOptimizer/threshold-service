import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { ThresholdId } from "@domain/value/ThresholdId";
import { ThresholdNotFoundError } from "@domain/errors";
import { Threshold } from "@domain/Threshold";

export class UpdateThresholdUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  public async executeById(id: ThresholdId, value: number): Promise<Threshold> {
    const threshold = await this.repository.findById(id);
    if (!threshold) {
      throw new ThresholdNotFoundError(id.value);
    }

    const updated = threshold.updateValue(value);
    await this.repository.save(updated);
    return updated;
  }
}
