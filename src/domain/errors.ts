import { ThresholdType } from "@domain/value/ThresholdType";

export class BaseDomainError extends Error {
  constructor(baseMessage: string, reason?: string) {
    super(reason ? `${baseMessage}: ${reason}` : baseMessage);
    this.name = new.target.name;
  }
}

export class InvalidThresholdValueError extends BaseDomainError {
  constructor(value: number, reason?: string) {
    super(`Invalid threshold value ${value}`, reason);
  }
}

export class ThresholdNotFoundError extends BaseDomainError {
  constructor(id: string, reason?: string) {
    super(`Threshold not found with id: ${id}`, reason);
  }
}

export class ThresholdAlreadyExistsError extends BaseDomainError {
  constructor(uniqueKey: string, reason?: string) {
    super(`Threshold already exists for key: ${uniqueKey}`, reason);
  }
}

export class InvalidQueryParametersError extends BaseDomainError {
  constructor(message: string, reason?: string) {
    super(`Invalid query parameters: ${message}`, reason);
  }
}

export class InvalidThresholdIdError extends BaseDomainError {
  constructor(id: string, reason?: string) {
    super(`Invalid threshold ID format: ${id}`, reason);
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
  constructor(reason?: string) {
    super("Access token is required", reason);
  }
}

export class UnauthorizedError extends BaseDomainError {
  constructor(message: string, reason?: string) {
    super(`Unauthorized: ${message}`, reason);
  }
}

export class ForbiddenError extends BaseDomainError {
  constructor(message: string, reason?: string) {
    super(`Forbidden: ${message}`, reason);
  }
}
