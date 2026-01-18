export class InvalidTokenError extends Error {
  constructor() {
    super("Access token is required");
    this.name = "InvalidTokenError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(`Unauthorized: ${message}`);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(`Forbidden: ${message}`);
    this.name = "ForbiddenError";
  }
}

export class InvalidQueryParametersError extends Error {
  constructor(message: string) {
    super(`Invalid query parameters: ${message}`);
    this.name = "InvalidQueryParametersError";
  }
}
