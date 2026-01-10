import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import axios from "axios";
import {
  ActualThresholdWithPeriodError,
  InvalidThresholdIdError,
  InvalidThresholdValueError,
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

/**
 * Express error handler that maps known errors to HTTP responses.
 *
 * @param error The error forwarded by controllers or middleware.
 * @param res The HTTP response.
 * @returns An HTTP response matching the error type.
 */
export const errorsHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "ValidationError",
      message: "Invalid request payload",
      code: "VALIDATION_ERROR",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      })),
    });
  }

  if (
    error instanceof InvalidThresholdIdError ||
    error instanceof InvalidThresholdValueError ||
    error instanceof InvalidQueryParametersError ||
    error instanceof ActualThresholdWithPeriodError ||
    error instanceof MissingPeriodTypeForThresholdError
  ) {
    return res.status(400).json({ error: error.message });
  }

  if (axios.isAxiosError(error) && error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 401 || status === 403) {
      return res.status(status).json(data);
    }
  }

  if (
    error instanceof InvalidTokenError ||
    error instanceof UnauthorizedError
  ) {
    return res.status(401).json({ error: error.message });
  }

  if (error instanceof ForbiddenError) {
    return res.status(403).json({ error: error.message });
  }

  if (error instanceof ThresholdNotFoundError) {
    return res.status(404).json({ error: error.message });
  }

  if (error instanceof ThresholdAlreadyExistsError) {
    return res.status(409).json({ error: error.message });
  }

  console.error("Unhandled error:", error);
  return res.status(500).json({ error: "Internal Server Error" });
};
