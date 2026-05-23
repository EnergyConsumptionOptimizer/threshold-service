import type { EvaluationService } from "@application/ports/in/EvaluationService";
import type {
	ThresholdOutput,
	ThresholdService,
} from "@application/ports/in/ThresholdService";
import { InternalController } from "@presentation/rest/InternalController";
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

describe("InternalController", () => {
	let evaluationService: MockProxy<EvaluationService>;
	let thresholdService: MockProxy<ThresholdService>;
	let controller: InternalController;

	beforeEach(() => {
		evaluationService = mock<EvaluationService>();
		thresholdService = mock<ThresholdService>();

		evaluationService.checkRealtimeReadings.mockResolvedValue();
		evaluationService.checkForecastReadings.mockResolvedValue();

		controller = new InternalController(evaluationService, thresholdService);
	});

	describe("evaluateRealtime()", () => {
		it("should call evaluationService.checkRealtimeReadings and return 200", async () => {
			const req = mockRequest({
				body: {
					readings: {
						electricity: { value: 150 },
					},
					context: {
						thresholdType: "ACTUAL",
					},
				},
			});
			const res = mockResponse();

			await controller.evaluateRealtime(req, res);

			expect(evaluationService.checkRealtimeReadings).toHaveBeenCalledWith({
				readings: { electricity: { value: 150 } },
				context: { thresholdType: "ACTUAL", periodType: undefined },
			});
			expect(res.sendStatus).toHaveBeenCalledWith(StatusCodes.OK);
		});

		it("should handle evaluation context with periodType", async () => {
			const req = mockRequest({
				body: {
					readings: {
						water: { value: 50 },
					},
					context: {
						thresholdType: "HISTORICAL",
						periodType: "ONE_DAY",
					},
				},
			});
			const res = mockResponse();

			await controller.evaluateRealtime(req, res);

			expect(evaluationService.checkRealtimeReadings).toHaveBeenCalledWith({
				readings: { water: { value: 50 } },
				context: {
					thresholdType: "HISTORICAL",
					periodType: expect.objectContaining({ value: "ONE_DAY" }),
				},
			});
			expect(res.sendStatus).toHaveBeenCalledWith(StatusCodes.OK);
		});
	});

	describe("evaluateForecast()", () => {
		it("should call evaluationService.checkForecastReadings and return 200", async () => {
			const req = mockRequest({
				body: {
					utilityType: "ELECTRICITY",
					dataPoints: [
						{ date: "2024-01-01", value: 250 },
						{ date: "2024-01-02", value: 150 },
					],
				},
			});
			const res = mockResponse();

			await controller.evaluateForecast(req, res);

			expect(evaluationService.checkForecastReadings).toHaveBeenCalledWith({
				utilityType: "ELECTRICITY",
				dataPoints: [
					{
						date: new Date("2024-01-01"),
						value: 250,
					},
					{
						date: new Date("2024-01-02"),
						value: 150,
					},
				],
			});
			expect(res.sendStatus).toHaveBeenCalledWith(StatusCodes.OK);
		});
	});

	describe("resetBreached()", () => {
		it("should return 200 with array of reset thresholds", async () => {
			const outputs: ThresholdOutput[] = [
				{
					id: "threshold-1",
					name: "Test",
					utilityType: "ELECTRICITY",
					value: 100,
					thresholdType: "HISTORICAL",
					thresholdState: "ENABLED",
					periodType: "ONE_DAY",
				},
			];
			thresholdService.reset.mockResolvedValue(outputs);

			const req = mockRequest();
			const res = mockResponse();

			await controller.resetBreached(req, res);

			expect(thresholdService.reset).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.json).toHaveBeenCalledWith(outputs);
		});

		it("should throw when reset returns an error", async () => {
			thresholdService.reset.mockResolvedValue(
				new Error("Reset failed") as never,
			);

			const req = mockRequest();
			const res = mockResponse();

			await expect(controller.resetBreached(req, res)).rejects.toThrow(
				"Reset failed",
			);
		});
	});
});
