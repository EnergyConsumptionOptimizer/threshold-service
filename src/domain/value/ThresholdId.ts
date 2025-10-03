import { validate, v4 as uuid } from "uuid";
import { InvalidThresholdIdError } from "../errors";

export class ThresholdId {
  private constructor(private readonly _value: string) {}

  static generate(): ThresholdId {
    return new ThresholdId(uuid());
  }

  static of(value: string): ThresholdId {
    if (!value.trim()) {
      throw new InvalidThresholdIdError(value, "cannot be empty");
    }

    if (!validate(value)) {
      throw new InvalidThresholdIdError(value);
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
