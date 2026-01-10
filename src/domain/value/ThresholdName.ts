import { InvalidThresholdNameError } from "@domain/errors";

/** Wraps a human-readable threshold name and rejects blank values. */
export class ThresholdName {
  private constructor(private readonly name: string) {}

  /**
   * Create a validated threshold name.
   * @param name - Trimmed and validated.
   * @returns The validated threshold name.
   */
  static of(name: string): ThresholdName {
    if (!name || name.trim().length === 0) {
      throw new InvalidThresholdNameError(
        name,
        "Threshold name must not be empty",
      );
    }
    return new ThresholdName(name);
  }

  equals(other: ThresholdName): boolean {
    return this.name === other.name;
  }

  toString(): string {
    return this.name.toString();
  }
}
