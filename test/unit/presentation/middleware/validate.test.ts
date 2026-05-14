import { validate } from "@presentation/rest/middleware/validate";
import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

function mockRequest(overrides?: Partial<Request>): Request {
	return {
		body: {},
		query: {},
		params: {},
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

describe("validate middleware", () => {
	it("should parse body and assign it to req.body", () => {
		const schema = z.object({
			body: z.object({
				name: z.string(),
			}),
		});
		const middleware = validate(schema);
		const req = mockRequest({ body: { name: "Test" } });
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		middleware(req, res, next);

		expect(req.body).toEqual({ name: "Test" });
		expect(next).toHaveBeenCalled();
	});

	it("should parse params and assign it to req.params", () => {
		const schema = z.object({
			params: z.object({
				id: z.string(),
			}),
		});
		const middleware = validate(schema);
		const req = mockRequest({ params: { id: "threshold-1" } });
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		middleware(req, res, next);

		expect(req.params).toEqual({ id: "threshold-1" });
		expect(next).toHaveBeenCalled();
	});

	it("should throw ZodError when validation fails", () => {
		const schema = z.object({
			body: z.object({
				name: z.string(),
			}),
		});
		const middleware = validate(schema);
		const req = mockRequest({ body: { name: 123 } });
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		expect(() => middleware(req, res, next)).toThrow(z.ZodError);
		expect(next).not.toHaveBeenCalled();
	});

	it("should parse both body and params together", () => {
		const schema = z.object({
			body: z.object({
				name: z.string(),
			}),
			params: z.object({
				id: z.string(),
			}),
		});
		const middleware = validate(schema);
		const req = mockRequest({
			body: { name: "Test" },
			params: { id: "threshold-1" },
		});
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		middleware(req, res, next);

		expect(req.body).toEqual({ name: "Test" });
		expect(req.params).toEqual({ id: "threshold-1" });
		expect(next).toHaveBeenCalled();
	});

	it("should not modify req.body when schema has no body key", () => {
		const schema = z.object({
			params: z.object({
				id: z.string(),
			}),
		});
		const middleware = validate(schema);
		const originalBody = { original: "data" };
		const req = mockRequest({
			body: originalBody,
			params: { id: "threshold-1" },
		});
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		middleware(req, res, next);

		expect(req.body).toBe(originalBody);
		expect(next).toHaveBeenCalled();
	});

	it("should parse query from req.query", () => {
		const schema = z.object({
			query: z.object({
				utilityType: z.string().optional(),
			}),
		});
		const middleware = validate(schema);
		const req = mockRequest({ query: { utilityType: "ELECTRICITY" } });
		const res = mockResponse();
		const next: NextFunction = vi.fn();

		middleware(req, res, next);

		expect(next).toHaveBeenCalled();
	});
});
