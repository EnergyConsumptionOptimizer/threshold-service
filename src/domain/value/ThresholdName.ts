import { DomainErrorCode, InvalidThresholdNameError } from "@domain/errors";

export class ThresholdName {
	private constructor(public readonly value: string) {}

	static of(name: string): ThresholdName | InvalidThresholdNameError {
		const trimmed = name.trim();
		if (!trimmed) {
			return new InvalidThresholdNameError(
				DomainErrorCode.THRESHOLD_NAME_EMPTY,
				"Threshold name must not be empty",
			);
		}
		return new ThresholdName(trimmed);
	}

	equals(other: ThresholdName): boolean {
		return this.value === other.value;
	}
}
