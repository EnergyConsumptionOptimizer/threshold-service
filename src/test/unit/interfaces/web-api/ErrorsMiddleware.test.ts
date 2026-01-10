import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { errorsHandler } from "@interfaces/web-api/middlewares/ErrorsMiddleware";
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
import { ZodError } from "zod";
import axios from "axios";
import { ThresholdType } from "@domain/value/ThresholdType";

describe("ErrorsMiddleware", () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;

  const req = {} as Request;
  const next = vi.fn() as unknown as NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 for ZodError", () => {
    const zerr = new ZodError([
      {
        path: ["a"],
        message: "bad",
        code: "custom",
      },
    ]);

    errorsHandler(zerr, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should propagate axios 401/403 errors", () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 401,
        data: { error: "Unauthorized" },
      },
    };

    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);

    errorsHandler(axiosError, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  it("should return 401 for InvalidTokenError", () => {
    errorsHandler(new InvalidTokenError(), req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return 401 for UnauthorizedError", () => {
    errorsHandler(new UnauthorizedError("not allowed"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return 403 for ForbiddenError", () => {
    errorsHandler(new ForbiddenError("forbidden"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should return 404 for ThresholdNotFoundError", () => {
    errorsHandler(new ThresholdNotFoundError("a"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should return 409 for ThresholdAlreadyExistsError", () => {
    errorsHandler(new ThresholdAlreadyExistsError("a"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("should return 400 for InvalidThresholdIdError", () => {
    errorsHandler(
      new InvalidThresholdIdError("x", "invalid format"),
      req,
      res,
      next,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 for InvalidThresholdValueError", () => {
    errorsHandler(
      new InvalidThresholdValueError(-10, "must be positive"),
      req,
      res,
      next,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 for InvalidQueryParametersError", () => {
    errorsHandler(new InvalidQueryParametersError("q"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 for ActualThresholdWithPeriodError", () => {
    errorsHandler(new ActualThresholdWithPeriodError(), req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 for MissingPeriodTypeForThresholdError", () => {
    errorsHandler(
      new MissingPeriodTypeForThresholdError(ThresholdType.HISTORICAL),
      req,
      res,
      next,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 500 for generic errors", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());
    errorsHandler(new Error("someRandomUnhandledError"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
    consoleSpy.mockRestore();
  });
});
