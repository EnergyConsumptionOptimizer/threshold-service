import { ThresholdType } from "@domain/value/ThresholdType";

export class BaseDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidThresholdValueError extends BaseDomainError {
  constructor(value: number, reason: string) {
    super(`Invalid threshold value ${value}: ${reason}`);
  }
}

export class ThresholdNotFoundError extends BaseDomainError {
  constructor(id: string) {
    super(`Threshold not found with id: ${id}`);
  }
}

export class ThresholdAlreadyExistsError extends BaseDomainError {
  constructor(uniqueKey: string) {
    super(`Threshold already exists for key: ${uniqueKey}`);
  }
}

export class InvalidQueryParametersError extends BaseDomainError {
  constructor(message: string) {
    super(`Invalid query parameters: ${message}`);
  }
}

export class InvalidThresholdIdError extends BaseDomainError {
  constructor(id: string, reason: string) {
    super(`Invalid threshold ID format: ${id}: ${reason}`);
  }
}

export class ActualThresholdWithPeriodError extends BaseDomainError {
  constructor() {
    super("Actual threshold cannot have a period type");
  }
}

export class MissingPeriodTypeForThresholdError extends BaseDomainError {
  constructor(thresholdType: ThresholdType) {
    super(`${thresholdType} threshold requires a period type`);
  }
}

export class InvalidTokenError extends BaseDomainError {
  constructor() {
    super("Access token is required");
  }
}

export class UnauthorizedError extends BaseDomainError {
  constructor(message: string) {
    super(`Unauthorized: ${message}`);
  }
}

export class ForbiddenError extends BaseDomainError {
  constructor(message: string) {
    super(`Forbidden: ${message}`);
  }
}
