import { DomainErrorCode, InvalidThresholdIdError } from "@domain/errors";

export class ThresholdId {
	private constructor(readonly value: string) {}

	static of(id: string): ThresholdId | InvalidThresholdIdError {
		const trimmed = id.trim();
		if (!trimmed) {
			return new InvalidThresholdIdError(
				DomainErrorCode.THRESHOLD_ID_EMPTY,
				"Threshold ID must not be empty",
			);
		}
		return new ThresholdId(trimmed);
	}

	equals(other: ThresholdId): boolean {
		return this.value === other.value;
	}
}
