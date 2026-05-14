import { DomainErrorCode, InvalidThresholdValueError } from "@domain/errors";

export class ThresholdValue {
	private constructor(readonly value: number) {}

	static of(value: number): ThresholdValue | InvalidThresholdValueError {
		if (value <= 0) {
			return new InvalidThresholdValueError(
				DomainErrorCode.THRESHOLD_VALUE_NOT_POSITIVE,
				"Threshold value must be greater than zero",
			);
		}
		return new ThresholdValue(value);
	}

	isBreachedBy(measured: number): boolean {
		return measured > this.value;
	}

	equals(other: ThresholdValue): boolean {
		return this.value === other.value;
	}
}
