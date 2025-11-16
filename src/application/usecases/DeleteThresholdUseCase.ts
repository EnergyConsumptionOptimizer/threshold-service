import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { ThresholdId } from "@domain/value/ThresholdId";

export class DeleteThresholdUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  public async delete(id: ThresholdId): Promise<void> {
    return this.repository.delete(id);
  }
}
