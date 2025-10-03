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
