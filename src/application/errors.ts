export class ThresholdNotFoundError extends Error {
  constructor(id: string) {
    super(`Threshold not found with id: ${id}`);
    this.name = "ThresholdNotFoundError";
  }
}

export class ThresholdAlreadyExistsError extends Error {
  constructor(uniqueKey: string) {
    super(`Threshold already exists for key: ${uniqueKey}`);
    this.name = "ThresholdAlreadyExistsError";
  }
}

export class InvalidQueryParametersError extends Error {
  constructor(message: string) {
    super(`Invalid query parameters: ${message}`);
    this.name = "InvalidQueryParametersError";
  }
}

export class InvalidThresholdIdError extends Error {
  constructor(id: string) {
    super(`Invalid threshold ID format: ${id}`);
    this.name = "InvalidThresholdIdError";
  }
}
