import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { Threshold } from "@domain/Threshold";
import { ThresholdId } from "@domain/value/ThresholdId";
import { ResourceType } from "@domain/value/ResourceType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";

export class InMemoryThresholdRepository implements ThresholdRepositoryPort {
  private thresholds = new Map<string, Threshold>();
  private businessKeyIndex = new Map<string, string>();

  async save(threshold: Threshold): Promise<void> {
    const id = threshold.id.value;
    const businessKey = threshold.getBusinessKey();

    this.thresholds.set(id, threshold);
    this.businessKeyIndex.set(businessKey, id);
  }

  async findById(id: ThresholdId): Promise<Threshold | undefined> {
    return this.thresholds.get(id.value);
  }

  async findByBusinessKey(businessKey: string): Promise<Threshold | undefined> {
    const id = this.businessKeyIndex.get(businessKey);
    return id ? this.thresholds.get(id) : undefined;
  }

  async findAll(): Promise<Threshold[]> {
    return Array.from(this.thresholds.values());
  }

  async findByFilters(
    resourceType?: ResourceType,
    periodType?: PeriodType,
    thresholdType?: ThresholdType,
  ): Promise<Threshold[]> {
    const allThresholds = Array.from(this.thresholds.values());

    return allThresholds.filter((threshold) => {
      if (resourceType && threshold.resourceType !== resourceType) {
        return false;
      }
      if (periodType && threshold.periodType !== periodType) {
        return false;
      }
      return !(thresholdType && threshold.thresholdType !== thresholdType);
    });
  }

  async update(threshold: Threshold): Promise<void> {
    const id = threshold.id.value;
    if (!this.thresholds.has(id)) {
      throw new Error(`Threshold with id ${id} not found`);
    }

    const businessKey = threshold.getBusinessKey();
    this.thresholds.set(id, threshold);
    this.businessKeyIndex.set(businessKey, id);
  }

  async delete(threshold: Threshold): Promise<void> {
    const id = threshold.id.value;
    const businessKey = threshold.getBusinessKey();

    this.thresholds.delete(id);
    this.businessKeyIndex.delete(businessKey);
  }

  clear(): void {
    this.thresholds.clear();
    this.businessKeyIndex.clear();
  }

  getThresholdCount(): number {
    return this.thresholds.size;
  }

  getAllBusinessKeys(): string[] {
    return Array.from(this.businessKeyIndex.keys());
  }

  getAllIds(): string[] {
    return Array.from(this.thresholds.keys());
  }
}
