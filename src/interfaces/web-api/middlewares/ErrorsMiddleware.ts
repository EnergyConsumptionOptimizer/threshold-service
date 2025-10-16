import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import {
  ActualThresholdWithPeriodError,
  InvalidQueryParametersError,
  InvalidThresholdIdError,
  InvalidThresholdValueError,
  MissingPeriodTypeForThresholdError,
  ThresholdAlreadyExistsError,
  ThresholdNotFoundError,
} from "@domain/errors";

const msgError = (message: string) => {
  return { error: message };
};

export const errorsHandler = (
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  void next;

  if (error instanceof ThresholdAlreadyExistsError) {
    return res.status(409).json(msgError(error.message));
  }

  if (error instanceof ThresholdNotFoundError) {
    return res.status(404).json(msgError(error.message));
  }

  if (error instanceof InvalidThresholdIdError) {
    return res.status(400).json(msgError(error.message));
  }

  if (
    error instanceof InvalidThresholdValueError ||
    error instanceof InvalidQueryParametersError ||
    error instanceof InvalidThresholdIdError ||
    error instanceof ActualThresholdWithPeriodError ||
    error instanceof MissingPeriodTypeForThresholdError
  ) {
    return res.status(400).json(msgError(error.message));
  }

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

  return res.status(500).json({ error: "Internal Server Error" });
};
