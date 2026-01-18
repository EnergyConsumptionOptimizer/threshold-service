import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import {
  ActualThresholdWithPeriodError,
  InvalidThresholdIdError,
  InvalidThresholdNameError,
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
import { errorsHandler } from "@interfaces/web-api/middlewares/ErrorsMiddleware";
import { ThresholdType } from "@domain/value/ThresholdType";

vi.mock("axios");

describe("ErrorsHandler Middleware", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    req = {} as Request;
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
    } as unknown as Response;
    next = vi.fn() as NextFunction;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("ZodError", () => {
    it("should return 400 with VALIDATION_ERROR for Zod validation issues", () => {
      const schema = z.object({
        name: z.string(),
      });

      const result = schema.safeParse({ name: 123 });

      if (result.success) {
        throw new Error("Test setup failed: Zod validation should have failed");
      }

      const error = result.error;

      errorsHandler(error, req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        errors: {
          name: "Invalid input: expected string, received number",
        },
      });
    });
  });

  describe("Domain Error Mapping", () => {
    it("should handle InvalidThresholdValueError (mapped with field)", () => {
      const error = new InvalidThresholdValueError(-10, "must be positive");
      error.name = "InvalidThresholdValueError";

      errorsHandler(error, req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        errors: { value: expect.stringContaining("must be positive") },
      });
    });

    it("should handle InvalidThresholdNameError (mapped with field)", () => {
      const error = new InvalidThresholdNameError("", "cannot be empty");
      error.name = "InvalidThresholdNameError";

      errorsHandler(error, req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        errors: { name: expect.stringContaining("cannot be empty") },
      });
    });

    it("should handle ThresholdAlreadyExistsError (mapped with field and 409)", () => {
      const error = new ThresholdAlreadyExistsError("test-threshold");
      error.name = "ThresholdAlreadyExistsError";

      errorsHandler(error, req, res, next);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        code: "CONFLICT",
        message: "Validation failed",
        errors: { name: expect.stringContaining("test-threshold") },
      });
    });

    it("should handle ActualThresholdWithPeriodError (mapped with field)", () => {
      const error = new ActualThresholdWithPeriodError();
      error.name = "ActualThresholdWithPeriodError";

      errorsHandler(error, req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        errors: { periodType: expect.any(String) },
      });
    });

    it("should handle ThresholdNotFoundError (mapped without field)", () => {
      const error = new ThresholdNotFoundError("123");
      error.name = "ThresholdNotFoundError";

      errorsHandler(error, req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        code: "RESOURCE_NOT_FOUND",
        message: expect.stringContaining("123"),
        errors: {},
      });
    });

    it("should handle InvalidThresholdIdError", () => {
      const error = new InvalidThresholdIdError("abc", "bad");
      error.name = "InvalidThresholdIdError";
      errorsHandler(error, req, res, next);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ code: "BAD_REQUEST" }),
      );
    });

    it("should handle InvalidQueryParametersError", () => {
      const error = new InvalidQueryParametersError("bad query");
      error.name = "InvalidQueryParametersError";
      errorsHandler(error, req, res, next);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ code: "BAD_REQUEST" }),
      );
    });

    it("should handle MissingPeriodTypeForThresholdError", () => {
      const error = new MissingPeriodTypeForThresholdError(
        ThresholdType.HISTORICAL,
      );
      error.name = "MissingPeriodTypeForThresholdError";
      errorsHandler(error, req, res, next);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ code: "VALIDATION_ERROR" }),
      );
    });
  });

  describe("Interface/Auth Error Mapping", () => {
    it("should handle InvalidTokenError", () => {
      const error = new InvalidTokenError();
      error.name = "InvalidTokenError";

      errorsHandler(error, req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        code: "UNAUTHORIZED",
        message: "Access token is required",
        errors: {},
      });
    });

    it("should handle UnauthorizedError", () => {
      const error = new UnauthorizedError("Bad credentials");
      error.name = "UnauthorizedError";

      errorsHandler(error, req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        code: "UNAUTHORIZED",
        message: "Unauthorized: Bad credentials",
        errors: {},
      });
    });

    it("should handle ForbiddenError", () => {
      const error = new ForbiddenError("Access denied");
      error.name = "ForbiddenError";

      errorsHandler(error, req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        code: "FORBIDDEN",
        message: "Forbidden: Access denied",
        errors: {},
      });
    });
  });
});
