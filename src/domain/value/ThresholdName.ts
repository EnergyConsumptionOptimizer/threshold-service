import { InvalidThresholdNameError } from "@domain/errors";

export class ThresholdName {
  private constructor(private readonly name: string) {}

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
