export const DomainErrorCode = {
	THRESHOLD_ID_EMPTY: "THRESHOLD_ID_EMPTY",
	THRESHOLD_NAME_EMPTY: "THRESHOLD_NAME_EMPTY",
	THRESHOLD_VALUE_NOT_POSITIVE: "THRESHOLD_VALUE_NOT_POSITIVE",
	PERIOD_TYPE_INVALID: "PERIOD_TYPE_INVALID",
	ACTUAL_THRESHOLD_WITH_PERIOD: "ACTUAL_THRESHOLD_WITH_PERIOD",
	MISSING_PERIOD_TYPE_FOR_THRESHOLD: "MISSING_PERIOD_TYPE_FOR_THRESHOLD",
	DUPLICATE_THRESHOLD_NAME: "DUPLICATE_THRESHOLD_NAME",
} as const;

export type ThresholdIdErrorCode = typeof DomainErrorCode.THRESHOLD_ID_EMPTY;
export type ThresholdNameErrorCode =
	typeof DomainErrorCode.THRESHOLD_NAME_EMPTY;
export type ThresholdValueErrorCode =
	typeof DomainErrorCode.THRESHOLD_VALUE_NOT_POSITIVE;
export type PeriodTypeErrorCode = typeof DomainErrorCode.PERIOD_TYPE_INVALID;

export abstract class DomainError extends Error {
	public abstract readonly code: string;
	protected constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export class InvalidThresholdIdError extends DomainError {
	constructor(
		public readonly code: ThresholdIdErrorCode,
		message: string,
	) {
		super(message);
	}
}

export class InvalidThresholdNameError extends DomainError {
	constructor(
		public readonly code: ThresholdNameErrorCode,
		message: string,
	) {
		super(message);
	}
}

export class InvalidThresholdValueError extends DomainError {
	constructor(
		public readonly code: ThresholdValueErrorCode,
		message: string,
	) {
		super(message);
	}
}

export class ActualThresholdWithPeriodError extends DomainError {
	public readonly code = DomainErrorCode.ACTUAL_THRESHOLD_WITH_PERIOD;

	constructor() {
		super("Actual threshold cannot have a period type");
	}
}

export class MissingPeriodTypeForThresholdError extends DomainError {
	public readonly code = DomainErrorCode.MISSING_PERIOD_TYPE_FOR_THRESHOLD;

	constructor(thresholdType: string) {
		super(`${thresholdType} threshold requires a period type`);
	}
}

export class InvalidPeriodTypeError extends DomainError {
	constructor(
		public readonly code: PeriodTypeErrorCode,
		message: string,
	) {
		super(message);
	}
}

export class DuplicateThresholdNameError extends DomainError {
	public readonly code = DomainErrorCode.DUPLICATE_THRESHOLD_NAME;

	constructor(name: string) {
		super(`A threshold with name '${name}' already exists`);
	}
}
