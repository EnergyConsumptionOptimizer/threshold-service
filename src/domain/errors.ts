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
    this.name = "InvalidThresholdValueError";
  }
}

export class InvalidThresholdNameError extends BaseDomainError {
  constructor(name: string, reason: string) {
    super(`Invalid threshold name ${name}: ${reason}`);
    this.name = "InvalidThresholdNameError";
  }
}

export class ThresholdNotFoundError extends BaseDomainError {
  constructor(id: string) {
    super(`Threshold not found with id: ${id}`);
    this.name = "ThresholdNotFoundError";
  }
}

export class ThresholdAlreadyExistsError extends BaseDomainError {
  constructor(uniqueKey: string) {
    super(`Threshold already exists with name: ${uniqueKey}`);
    this.name = "ThresholdAlreadyExistsError";
  }
}

export class InvalidThresholdIdError extends BaseDomainError {
  constructor(id: string, reason: string) {
    super(`Invalid threshold ID format: ${id}: ${reason}`);
    this.name = "InvalidThresholdIdError";
  }
}

export class ActualThresholdWithPeriodError extends BaseDomainError {
  constructor() {
    super("Actual threshold cannot have a period type");
    this.name = "ActualThresholdWithPeriodError";
  }
}

export class MissingPeriodTypeForThresholdError extends BaseDomainError {
  constructor(thresholdType: ThresholdType) {
    super(`${thresholdType} threshold requires a period type`);
    this.name = "MissingPeriodTypeForThresholdError";
  }
}
