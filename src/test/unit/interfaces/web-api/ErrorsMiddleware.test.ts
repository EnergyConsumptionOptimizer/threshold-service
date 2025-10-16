import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { errorsHandler } from "@interfaces/web-api/middlewares/ErrorsMiddleware";
import {
  InvalidQueryParametersError,
  InvalidThresholdValueError,
  ThresholdAlreadyExistsError,
  ThresholdNotFoundError,
} from "@domain/errors";
import { ZodError } from "zod";

describe("ErrorsMiddleware", () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;

  const req = {} as Request;
  const next = vi.fn() as unknown as NextFunction;

  it("should return 409 when a ThresholdAlreadyExistsError occurs", () => {
    errorsHandler(new ThresholdAlreadyExistsError("a"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("should return 404 when a ThresholdNotFoundError occurs", () => {
    errorsHandler(new ThresholdNotFoundError("a"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should return 400 when an InvalidThresholdValueError occurs", () => {
    errorsHandler(new InvalidThresholdValueError(-50), req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 when an InvalidQueryParametersError occurs", () => {
    errorsHandler(new InvalidQueryParametersError("a"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 when a ZodError occurs", () => {
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

  it("should return 500 for generic errors", () => {
    errorsHandler(new Error("boom"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
