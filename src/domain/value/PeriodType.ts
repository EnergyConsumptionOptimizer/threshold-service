import { DomainErrorCode, InvalidPeriodTypeError } from "@domain/errors";

export class PeriodType {
	static readonly ONE_DAY = new PeriodType("ONE_DAY");
	static readonly ONE_WEEK = new PeriodType("ONE_WEEK");
	static readonly ONE_MONTH = new PeriodType("ONE_MONTH");

	private constructor(public readonly value: string) {}

	static of(value: string): PeriodType | InvalidPeriodTypeError {
		const trimmed = value.trim();
		const found = [
			PeriodType.ONE_DAY,
			PeriodType.ONE_WEEK,
			PeriodType.ONE_MONTH,
		].find((p) => p.value === trimmed);
		if (!found) {
			return new InvalidPeriodTypeError(
				DomainErrorCode.PERIOD_TYPE_INVALID,
				`Invalid period type: ${trimmed}`,
			);
		}
		return found;
	}

	isEligibleForReset(now: Date): boolean {
		if (this === PeriodType.ONE_DAY) {
			return true;
		}
		if (this === PeriodType.ONE_WEEK) {
			return now.getDay() === 1;
		}
		if (this === PeriodType.ONE_MONTH) {
			return now.getDate() === 1;
		}
		return false;
	}

	equals(other: PeriodType): boolean {
		return this.value === other.value;
	}
}
