export const AppErrorCode = {
	THRESHOLD_NOT_FOUND: "THRESHOLD_NOT_FOUND",
} as const;

export abstract class ApplicationError extends Error {
	public abstract readonly code: string;

	protected constructor(message: string) {
		super(message);
		this.name = this.constructor.name;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export class ThresholdNotFoundError extends ApplicationError {
	public readonly code = AppErrorCode.THRESHOLD_NOT_FOUND;

	constructor(id: string) {
		super(`Threshold not found with id: ${id}`);
	}
}
