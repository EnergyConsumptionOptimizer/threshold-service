import { ThresholdNotFoundError } from "@application/errors";
import type {
	ThresholdOutput,
	ThresholdService,
} from "@application/ports/in/ThresholdService";
import {
	DuplicateThresholdNameError,
	InvalidThresholdNameError,
	InvalidThresholdValueError,
} from "@domain/errors";
import { ThresholdController } from "@presentation/rest/ThresholdController";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type MockProxy, mock } from "vitest-mock-extended";

function mockRequest(overrides?: Partial<Request>): Request {
	return {
		params: {},
		body: {},
		query: {},
		...overrides,
	} as Request;
}

function mockResponse(): Response {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		sendStatus: vi.fn().mockReturnThis(),
		headersSent: false,
	};
	return res as unknown as Response;
}

const THRESHOLD_OUTPUT: ThresholdOutput = {
	id: "threshold-1",
	name: "Test Threshold",
	utilityType: "ELECTRICITY",
	value: 100,
	thresholdType: "HISTORICAL",
	thresholdState: "ENABLED",
	periodType: "ONE_DAY",
};

describe("ThresholdController", () => {
	let thresholdService: MockProxy<ThresholdService>;
	let controller: ThresholdController;

	beforeEach(() => {
		thresholdService = mock<ThresholdService>();
		controller = new ThresholdController(thresholdService);
	});

	describe("create()", () => {
		it("should create a threshold and return status 201", async () => {
			thresholdService.create.mockResolvedValue(THRESHOLD_OUTPUT);
			const req = mockRequest({
				body: {
					name: "Test Threshold",
					utilityType: "ELECTRICITY",
					value: 100,
					thresholdType: "HISTORICAL",
				},
			});
			const res = mockResponse();

			await controller.create(req, res);

			expect(thresholdService.create).toHaveBeenCalledWith({
				name: "Test Threshold",
				utilityType: "ELECTRICITY",
				value: 100,
				thresholdType: "HISTORICAL",
				periodType: undefined,
			});
			expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
			expect(res.json).toHaveBeenCalledWith(THRESHOLD_OUTPUT);
		});

		it("should throw InvalidThresholdNameError when name is invalid", async () => {
			const error = new InvalidThresholdNameError(
				"THRESHOLD_NAME_EMPTY",
				"Threshold name cannot be empty",
			);
			thresholdService.create.mockResolvedValue(error);
			const req = mockRequest({ body: { name: "" } });
			const res = mockResponse();

			await expect(controller.create(req, res)).rejects.toThrow(
				InvalidThresholdNameError,
			);
		});

		it("should throw DuplicateThresholdNameError when name already exists", async () => {
			const error = new DuplicateThresholdNameError("Test");
			thresholdService.create.mockResolvedValue(error);
			const req = mockRequest({ body: { name: "Test" } });
			const res = mockResponse();

			await expect(controller.create(req, res)).rejects.toThrow(
				DuplicateThresholdNameError,
			);
		});
	});

	describe("list()", () => {
		it("should return list of thresholds with status 200", async () => {
			const thresholds: ThresholdOutput[] = [
				{
					id: "id-1",
					name: "A",
					utilityType: "ELECTRICITY",
					value: 50,
					thresholdType: "ACTUAL",
					thresholdState: "ENABLED",
				},
				{
					id: "id-2",
					name: "B",
					utilityType: "GAS",
					value: 200,
					thresholdType: "HISTORICAL",
					thresholdState: "ENABLED",
					periodType: "ONE_DAY",
				},
			];
			thresholdService.list.mockResolvedValue(thresholds);
			const req = mockRequest({ query: {} });
			const res = mockResponse();

			await controller.list(req, res);

			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.json).toHaveBeenCalledWith(thresholds);
		});

		it("should return empty array when no thresholds exist", async () => {
			thresholdService.list.mockResolvedValue([]);
			const req = mockRequest({ query: {} });
			const res = mockResponse();

			await controller.list(req, res);

			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.json).toHaveBeenCalledWith([]);
		});
	});

	describe("findById()", () => {
		it("should return threshold with status 200 when found", async () => {
			thresholdService.getById.mockResolvedValue(THRESHOLD_OUTPUT);
			const req = mockRequest({ params: { id: "threshold-1" } });
			const res = mockResponse();

			await controller.findById(req, res);

			expect(thresholdService.getById).toHaveBeenCalledWith("threshold-1");
			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.json).toHaveBeenCalledWith(THRESHOLD_OUTPUT);
		});

		it("should throw ThresholdNotFoundError when not found", async () => {
			const error = new ThresholdNotFoundError("unknown-id");
			thresholdService.getById.mockResolvedValue(error);
			const req = mockRequest({ params: { id: "unknown-id" } });
			const res = mockResponse();

			await expect(controller.findById(req, res)).rejects.toThrow(
				ThresholdNotFoundError,
			);
		});
	});

	describe("update()", () => {
		it("should update threshold and return status 200", async () => {
			const updated: ThresholdOutput = {
				...THRESHOLD_OUTPUT,
				name: "Updated Name",
			};
			thresholdService.update.mockResolvedValue(updated);
			const req = mockRequest({
				params: { id: "threshold-1" },
				body: { name: "Updated Name" },
			});
			const res = mockResponse();

			await controller.update(req, res);

			expect(thresholdService.update).toHaveBeenCalledWith("threshold-1", {
				name: "Updated Name",
			});
			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.json).toHaveBeenCalledWith(updated);
		});

		it("should throw ThresholdNotFoundError when threshold does not exist", async () => {
			const error = new ThresholdNotFoundError("unknown-id");
			thresholdService.update.mockResolvedValue(error);
			const req = mockRequest({
				params: { id: "unknown-id" },
				body: { value: 200 },
			});
			const res = mockResponse();

			await expect(controller.update(req, res)).rejects.toThrow(
				ThresholdNotFoundError,
			);
		});

		it("should throw InvalidThresholdValueError when value is not positive", async () => {
			const error = new InvalidThresholdValueError(
				"THRESHOLD_VALUE_NOT_POSITIVE",
				"Value must be positive",
			);
			thresholdService.update.mockResolvedValue(error);
			const req = mockRequest({
				params: { id: "threshold-1" },
				body: { value: 0 },
			});
			const res = mockResponse();

			await expect(controller.update(req, res)).rejects.toThrow(
				InvalidThresholdValueError,
			);
		});
	});

	describe("delete()", () => {
		it("should delete threshold and return status 204", async () => {
			thresholdService.delete.mockResolvedValue(undefined);
			const req = mockRequest({ params: { id: "threshold-1" } });
			const res = mockResponse();

			await controller.delete(req, res);

			expect(thresholdService.delete).toHaveBeenCalledWith("threshold-1");
			expect(res.sendStatus).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
		});

		it("should throw ThresholdNotFoundError when threshold does not exist", async () => {
			const error = new ThresholdNotFoundError("unknown-id");
			thresholdService.delete.mockResolvedValue(error);
			const req = mockRequest({ params: { id: "unknown-id" } });
			const res = mockResponse();

			await expect(controller.delete(req, res)).rejects.toThrow(
				ThresholdNotFoundError,
			);
		});
	});
});
