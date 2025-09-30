import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { Threshold } from "@domain/Threshold";
import { ThresholdId } from "@domain/value/ThresholdId";
import { ThresholdNotFoundError } from "@application/errors";

export class GetThresholdUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  public async executeById(id: ThresholdId): Promise<Threshold> {
    const threshold = await this.repository.findById(id);
    if (!threshold) {
      throw new ThresholdNotFoundError(`ID: ${id.value}`);
    }
    return threshold;
  }

  public async executeByBusinessKey(businessKey: string): Promise<Threshold> {
    const threshold = await this.repository.findByBusinessKey(businessKey);
    if (!threshold) {
      throw new ThresholdNotFoundError(`BusinessKey: ${businessKey}`);
    }
    return threshold;
  }
}
