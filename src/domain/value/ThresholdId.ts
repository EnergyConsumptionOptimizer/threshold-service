import { InvalidThresholdIdError } from "@domain/errors";

/** Wraps a threshold identifier and enforces basic normalization/validation. */
export class ThresholdId {
  private constructor(public readonly value: string) {}

  /**
   * Create a normalized threshold ID.
   * @param value - Trimmed before validation.
   * @returns The normalized ID.
   */
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

  valueOf(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: ThresholdId): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
