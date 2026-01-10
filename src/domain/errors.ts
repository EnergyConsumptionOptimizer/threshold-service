import { ThresholdType } from "@domain/value/ThresholdType";

/** Base type for domain errors raised by invariant/validation failures. */
export class BaseDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** Reject a threshold value that violates validation rules. */
export class InvalidThresholdValueError extends BaseDomainError {
  constructor(value: number, reason: string) {
    super(`Invalid threshold value ${value}: ${reason}`);
  }
}

/** Reject a threshold name that violates validation rules. */
export class InvalidThresholdNameError extends BaseDomainError {
  constructor(name: string, reason: string) {
    super(`Invalid threshold name ${name}: ${reason}`);
  }
}

/** Signal that a requested threshold does not exist. */
export class ThresholdNotFoundError extends BaseDomainError {
  constructor(id: string) {
    super(`Threshold not found with id: ${id}`);
  }
}

/** Signal that a threshold conflicts with a unique constraint (typically name). */
export class ThresholdAlreadyExistsError extends BaseDomainError {
  constructor(uniqueKey: string) {
    super(`Threshold already exists with name: ${uniqueKey}`);
  }
}

/** Reject a threshold ID that cannot be normalized/validated. */
export class InvalidThresholdIdError extends BaseDomainError {
  constructor(id: string, reason: string) {
    super(`Invalid threshold ID format: ${id}: ${reason}`);
  }
}

/** Reject an ACTUAL threshold that specifies a period. */
export class ActualThresholdWithPeriodError extends BaseDomainError {
  constructor() {
    super("Actual threshold cannot have a period type");
  }
}

/** Reject a HISTORICAL/FORECAST threshold without a period. */
export class MissingPeriodTypeForThresholdError extends BaseDomainError {
  constructor(thresholdType: ThresholdType) {
    super(`${thresholdType} threshold requires a period type`);
  }
}
