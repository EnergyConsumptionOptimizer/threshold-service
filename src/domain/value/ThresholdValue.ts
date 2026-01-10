import { InvalidThresholdValueError } from "@domain/errors";

/** Wraps a numeric limit and enforces that it is strictly positive. */
export class ThresholdValue {
  private constructor(private readonly limit: number) {}

  /**
   * Create a validated threshold limit.
   * @returns The validated threshold value.
   */
  static of(limit: number): ThresholdValue {
    if (limit <= 0) {
      throw new InvalidThresholdValueError(
        limit,
        "Threshold value must be greater than zero",
      );
    }
    return new ThresholdValue(limit);
  }

  equals(other: ThresholdValue): boolean {
    return this.limit === other.limit;
  }

  isBreachedBy(measured: number): boolean {
    return measured > this.limit;
  }

  toString(): string {
    return this.limit.toString();
  }

  valueOf(): number {
    return this.limit;
  }
}
