import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { ThresholdId } from "@domain/value/ThresholdId";
import { Threshold } from "@domain/Threshold";
import { ThresholdNotFoundError } from "../errors";

export class UpdateThresholdUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  public async executeById(id: ThresholdId, value: number): Promise<Threshold> {
    const threshold = await this.repository.findById(id);
    if (!threshold) {
      throw new ThresholdNotFoundError(`ID: ${id.value}`);
    }

    const updated = threshold.updateValue(value);
    await this.repository.save(updated);
    return updated;
  }

  public async executeByBusinessKey(
    businessKey: string,
    value: number,
  ): Promise<Threshold> {
    const threshold = await this.repository.findByBusinessKey(businessKey);
    if (!threshold) {
      throw new ThresholdNotFoundError(`BusinessKey: ${businessKey}`);
    }

    const updated = threshold.updateValue(value);
    await this.repository.save(updated);
    return updated;
  }
}
