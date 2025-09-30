export class InvalidThresholdValueError extends Error {
  constructor(value: number, reason: string) {
    super(`Invalid threshold value ${value}: ${reason}`);
    this.name = "InvalidThresholdValueError";
  }
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
