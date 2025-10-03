import { ResourceType } from "./value/ResourceType";
import { PeriodType } from "./value/PeriodType";
import { ThresholdType } from "./value/ThresholdType";
import { ThresholdValue } from "./value/ThresholdValue";
import { ThresholdId } from "./value/ThresholdId";

export class Threshold {
  private constructor(
    private readonly _id: ThresholdId,
    private readonly _resourceType: ResourceType,
    private readonly _periodType: PeriodType,
    private readonly _thresholdType: ThresholdType,
    private readonly _value: ThresholdValue,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  static create(params: {
    resourceType: ResourceType;
    periodType: PeriodType;
    thresholdType: ThresholdType;
    value: number;
  }): Threshold {
    const id = ThresholdId.generate();
    const validatedValue = ThresholdValue.of(params.value);
    const now = new Date();

    return new Threshold(
      id,
      params.resourceType,
      params.periodType,
      params.thresholdType,
      validatedValue,
      now,
      now,
    );
  }

  static reconstitute(data: {
    id: string;
    resourceType: ResourceType;
    periodType: PeriodType;
    thresholdType: ThresholdType;
    value: number;
    createdAt: Date;
    updatedAt: Date;
  }): Threshold {
    return new Threshold(
      ThresholdId.of(data.id),
      data.resourceType,
      data.periodType,
      data.thresholdType,
      ThresholdValue.of(data.value),
      data.createdAt,
      data.updatedAt,
    );
  }

  updateValue(newValue: number): Threshold {
    return new Threshold(
      this._id,
      this._resourceType,
      this._periodType,
      this._thresholdType,
      ThresholdValue.of(newValue),
      this._createdAt,
      new Date(),
    );
  }

  getBusinessKey(): string {
    return `${this._resourceType}-${this._periodType}-${this._thresholdType}`;
  }

  static createBusinessKey(
    resourceType: ResourceType,
    periodType: PeriodType,
    thresholdType: ThresholdType,
  ): string {
    return `${resourceType}-${periodType}-${thresholdType}`;
  }

  isExceededBy(actualValue: number): boolean {
    return actualValue > this._value.value;
  }

  equals(other: Threshold): boolean {
    return this._id.equals(other._id) && this.hasSameConfiguration(other);
  }

  hasSameConfiguration(other: Threshold): boolean {
    return (
      this._resourceType === other._resourceType &&
      this._periodType === other._periodType &&
      this._thresholdType === other._thresholdType
    );
  }

  get id(): ThresholdId {
    return this._id;
  }

  get resourceType(): ResourceType {
    return this._resourceType;
  }

  get periodType(): PeriodType {
    return this._periodType;
  }

  get thresholdType(): ThresholdType {
    return this._thresholdType;
  }

  get value(): ThresholdValue {
    return this._value;
  }

  get createdAt(): Date {
    return new Date(this._createdAt.getTime());
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt.getTime());
  }
}
