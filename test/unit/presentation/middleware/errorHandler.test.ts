import { ThresholdNotFoundError } from "@application/errors";
import {
	ActualThresholdWithPeriodError,
	DuplicateThresholdNameError,
	InvalidPeriodTypeError,
	InvalidThresholdIdError,
	InvalidThresholdNameError,
	InvalidThresholdValueError,
	MissingPeriodTypeForThresholdError,
} from "@domain/errors";
import { AuthRequiredError, ForbiddenError } from "@presentation/errors";
import { createErrorHandler } from "@presentation/rest/middleware/errorHandler";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { Logger } from "pino";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type ZodError, z } from "zod";

function mockLogger(): Logger {
	return {
		warn: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn(),
		fatal: vi.fn(),
		child: vi.fn(),
		level: "info",
		silent: vi.fn(),
	} as unknown as Logger;
}

function mockRequest(overrides?: Partial<Request>): Request {
	return {
		path: "/api/thresholds",
		method: "POST",
		...overrides,
	} as Request;
}

function mockResponse(): Response {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		headersSent: false,
	};
	return res as unknown as Response;
}

describe("createErrorHandler", () => {
	let logger: Logger;
	let errorHandler: ReturnType<typeof createErrorHandler>;

	beforeEach(() => {
		logger = mockLogger();
		errorHandler = createErrorHandler(logger);
	});

	it("should pass to next if headers are already sent", () => {
		const error = new Error("test");
		const req = mockRequest();
		const res = mockResponse();
		res.headersSent = true;
		const next: NextFunction = vi.fn();

		errorHandler(error, req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.status).not.toHaveBeenCalled();
	});

	it("should handle ZodError with 400 and field errors", () => {
		const zodError = z
			.object({ body: z.object({ name: z.string() }) })
			.safeParse({ body: {} }).error as ZodError;
		const req = mockRequest();
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		errorHandler(zodError, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
		expect(res.json).toHaveBeenCalledWith({
			code: "VALIDATION_ERROR",
			message: "Invalid request payload",
			errors: expect.objectContaining({ "body.name": expect.any(String) }),
		});
	});

	it("should handle ThresholdNotFoundError with 404", () => {
		const error = new ThresholdNotFoundError("id-1");
		const req = mockRequest();
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		errorHandler(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
		expect(res.json).toHaveBeenCalledWith({
			code: "RESOURCE_NOT_FOUND",
			message: "Threshold not found with id: id-1",
		});
	});

	it("should handle DuplicateThresholdNameError with 409", () => {
		const error = new DuplicateThresholdNameError("Test");
		const req = mockRequest();
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		errorHandler(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.CONFLICT);
		expect(res.json).toHaveBeenCalledWith({
			code: "CONFLICT",
			message: "A threshold with name 'Test' already exists",
			errors: { name: "A threshold with name 'Test' already exists" },
		});
	});

	it("should handle AuthRequiredError with 401", () => {
		const error = new AuthRequiredError();
		const req = mockRequest();
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		errorHandler(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
		expect(res.json).toHaveBeenCalledWith({
			code: "UNAUTHORIZED",
			message: "Authentication required",
		});
	});

	it("should handle ForbiddenError with 403", () => {
		const error = new ForbiddenError();
		const req = mockRequest();
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		errorHandler(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
		expect(res.json).toHaveBeenCalledWith({
			code: "FORBIDDEN",
			message: "Forbidden: Insufficient permissions",
		});
	});

	it("should handle InvalidThresholdValueError with 400", () => {
		const error = new InvalidThresholdValueError(
			"THRESHOLD_VALUE_NOT_POSITIVE",
			"Value must be positive",
		);
		const req = mockRequest();
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		errorHandler(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
		expect(res.json).toHaveBeenCalledWith({
			code: "VALIDATION_ERROR",
			message: "Value must be positive",
		});
	});

	it("should handle InvalidThresholdNameError with 400", () => {
		const error = new InvalidThresholdNameError(
			"THRESHOLD_NAME_EMPTY",
			"Name cannot be empty",
		);
		const req = mockRequest();
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		errorHandler(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
		expect(res.json).toHaveBeenCalledWith({
			code: "VALIDATION_ERROR",
			message: "Name cannot be empty",
		});
	});

	it("should handle InvalidThresholdIdError with 400", () => {
		const error = new InvalidThresholdIdError(
			"THRESHOLD_ID_EMPTY",
			"ID cannot be empty",
		);
		const req = mockRequest();
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		errorHandler(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
	});

	it("should handle ActualThresholdWithPeriodError with 400", () => {
		const error = new ActualThresholdWithPeriodError();
		const req = mockRequest();
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		errorHandler(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
	});

	it("should handle MissingPeriodTypeForThresholdError with 400", () => {
		const error = new MissingPeriodTypeForThresholdError("HISTORICAL");
		const req = mockRequest();
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		errorHandler(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
	});

	it("should handle InvalidPeriodTypeError with 400", () => {
		const error = new InvalidPeriodTypeError(
			"PERIOD_TYPE_INVALID",
			"Invalid period type",
		);
		const req = mockRequest();
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		errorHandler(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
	});

	it("should handle unknown errors with 500", () => {
		const error = new Error("Unexpected failure");
		const req = mockRequest();
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		errorHandler(error, req, res, next);

		expect(logger.error).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
		expect(res.json).toHaveBeenCalledWith({
			code: "INTERNAL_SERVER_ERROR",
			message: "An unexpected error occurred",
		});
	});
});
