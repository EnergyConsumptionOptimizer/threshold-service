/** Error thrown when an auth cookie is missing or empty. */
export class InvalidTokenError extends Error {
  constructor() {
    super("Access token is required");
    this.name = this.constructor.name;
  }
}

/** Error thrown when authentication fails. */
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(`Unauthorized: ${message}`);
    this.name = this.constructor.name;
  }
}

/** Error thrown when the authenticated user lacks required permissions. */
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(`Forbidden: ${message}`);
    this.name = this.constructor.name;
  }
}

/** Error thrown when query parameters cannot be parsed or validated. */
export class InvalidQueryParametersError extends Error {
  constructor(message: string) {
    super(`Invalid query parameters: ${message}`);
    this.name = this.constructor.name;
  }
}
