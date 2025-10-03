import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { Threshold } from "@domain/Threshold";
import { ThresholdId } from "@domain/value/ThresholdId";
import { ThresholdNotFoundError } from "@domain/errors";

export class GetThresholdUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  public async executeById(id: ThresholdId): Promise<Threshold> {
    const threshold = await this.repository.findById(id);
    if (!threshold) {
      throw new ThresholdNotFoundError(id.value);
    }
    return threshold;
  }
}
