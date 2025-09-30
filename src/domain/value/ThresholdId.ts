import { validate, v4 as uuid } from "uuid";
import { DomainError } from "../errors";

export class ThresholdId {
  private constructor(private readonly _value: string) {}

  static generate(): ThresholdId {
    return new ThresholdId(uuid());
  }

  static of(value: string): ThresholdId {
    if (!value.trim()) {
      throw new DomainError("ThresholdId cannot be empty");
    }

    if (!validate(value)) {
      throw new DomainError(`Invalid ThresholdId format: ${value}`);
    }

    return new ThresholdId(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: ThresholdId): boolean {
    return other.value === this._value;
  }

  toString(): string {
    return this._value;
  }

  valueOf(): string {
    return this._value;
  }
}
