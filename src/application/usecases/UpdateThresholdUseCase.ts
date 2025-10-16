import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { ThresholdId } from "@domain/value/ThresholdId";
import { Threshold } from "@domain/Threshold";

export class UpdateThresholdUseCase {
  constructor(private readonly repository: ThresholdRepositoryPort) {}

  public async update(
    id: ThresholdId,
    attrs: Partial<Threshold>,
  ): Promise<Threshold | null> {
    return this.repository.update(id, attrs);
  }
}
