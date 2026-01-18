import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import axios from "axios";

import {
  ActualThresholdWithPeriodError,
  InvalidThresholdIdError,
  InvalidThresholdValueError,
  InvalidThresholdNameError,
  MissingPeriodTypeForThresholdError,
  ThresholdAlreadyExistsError,
  ThresholdNotFoundError,
} from "@domain/errors";

import {
  ForbiddenError,
  InvalidQueryParametersError,
  InvalidTokenError,
  UnauthorizedError,
} from "@interfaces/web-api/errors";

interface ErrorConfig {
  status: number;
  code: string;
  field?: string;
}

const ERROR_MAP = new Map<string, ErrorConfig>([
  [
    InvalidThresholdValueError.name,
    { status: 400, code: "VALIDATION_ERROR", field: "value" },
  ],
  [
    InvalidThresholdNameError.name,
    { status: 400, code: "VALIDATION_ERROR", field: "name" },
  ],
  [
    ThresholdAlreadyExistsError.name,
    { status: 409, code: "CONFLICT", field: "name" },
  ],
  [
    ActualThresholdWithPeriodError.name,
    { status: 400, code: "VALIDATION_ERROR", field: "periodType" },
  ],
  [
    MissingPeriodTypeForThresholdError.name,
    { status: 400, code: "VALIDATION_ERROR", field: "periodType" },
  ],
  [InvalidThresholdIdError.name, { status: 400, code: "BAD_REQUEST" }],
  [InvalidQueryParametersError.name, { status: 400, code: "BAD_REQUEST" }],
  [ThresholdNotFoundError.name, { status: 404, code: "RESOURCE_NOT_FOUND" }],
  [InvalidTokenError.name, { status: 401, code: "UNAUTHORIZED" }],
  [UnauthorizedError.name, { status: 401, code: "UNAUTHORIZED" }],
  [ForbiddenError.name, { status: 403, code: "FORBIDDEN" }],
]);

export const errorsHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};

    error.issues.forEach((issue) => {
      fieldErrors[issue.path.join(".")] = issue.message;
    });

    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Invalid request payload",
      errors: fieldErrors,
    });
  }

  const config = ERROR_MAP.get(error.name);

  if (config) {
    const errorsPayload = config.field ? { [config.field]: error.message } : {};

    return res.status(config.status).json({
      code: config.code,
      message: config.field ? "Validation failed" : error.message,
      errors: errorsPayload,
    });
  }

  if (axios.isAxiosError(error) && error.response) {
    return res.status(error.response.status).json(error.response.data);
  }

  console.error("Unhandled error:", error);

  return res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "Internal Server Error",
    errors: {},
  });
};
