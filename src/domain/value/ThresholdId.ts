import { InvalidThresholdIdError } from "@domain/errors";

export class ThresholdId {
  private constructor(public readonly value: string) {}

  static of(value: string): ThresholdId {
    const normalized = value?.trim();
    if (!normalized) {
      throw new InvalidThresholdIdError(
        value,
        "ThresholdId cannot be empty or blank",
      );
    }
    return new ThresholdId(normalized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ThresholdId): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
