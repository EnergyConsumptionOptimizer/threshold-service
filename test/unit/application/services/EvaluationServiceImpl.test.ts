import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import type { EventPublisher } from "@application/ports/out/EventPublisher";
import type { UnitOfWork } from "@application/ports/out/UnitOfWork";
import { EvaluationServiceImpl } from "@application/services/EvaluationServiceImpl";
import type { ThresholdRepository } from "@domain/ports/ThresholdRepository";
import { ThresholdStates } from "@domain/value/ThresholdState";
import { ThresholdTypes } from "@domain/value/ThresholdType";
import { UtilityTypes } from "@domain/value/UtilityType";
import {
	aThreshold,
	validId,
	validName,
	validValue,
} from "@test/domainFactories";
import { beforeEach, describe, expect, it } from "vitest";
import { type MockProxy, mock } from "vitest-mock-extended";

describe("EvaluationServiceImpl", () => {
	let repository: MockProxy<ThresholdRepository>;
	let uow: MockProxy<UnitOfWork>;
	let eventPublisher: MockProxy<EventPublisher>;
	let metrics: MockProxy<BusinessMetricsPort>;
	let service: EvaluationServiceImpl;

	beforeEach(() => {
		repository = mock<ThresholdRepository>();
		uow = mock<UnitOfWork>();
		eventPublisher = mock<EventPublisher>();
		metrics = mock<BusinessMetricsPort>();

		repository.findActive.mockResolvedValue([]);
		repository.save.mockResolvedValue();
		uow.executeTransactionally.mockImplementation(async (fn) =>
			(fn as () => Promise<void>)(),
		);
		eventPublisher.publish.mockResolvedValue();

		service = new EvaluationServiceImpl(
			repository,
			uow,
			eventPublisher,
			metrics,
		);
	});

	describe("checkRealtimeReadings()", () => {
		it("should evaluate electricity reading and save breached thresholds via UoW", async () => {
			const threshold = aThreshold({
				id: validId("t1"),
				name: validName("Electricity Limit"),
				utilityType: UtilityTypes.ELECTRICITY,
				value: validValue(100),
				thresholdType: ThresholdTypes.ACTUAL,
				thresholdState: ThresholdStates.ENABLED,
				periodType: undefined,
			});
			repository.findActive.mockResolvedValue([threshold]);

			await service.checkRealtimeReadings({
				readings: {
					electricity: { value: 150 },
				},
				context: {
					thresholdType: ThresholdTypes.ACTUAL,
				},
			});

			expect(repository.findActive).toHaveBeenCalledWith(
				UtilityTypes.ELECTRICITY,
				ThresholdTypes.ACTUAL,
				undefined,
			);
			expect(uow.executeTransactionally).toHaveBeenCalledTimes(1);
			expect(repository.save).toHaveBeenCalled();
			expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
			expect(metrics.recordThresholdBreach).toHaveBeenCalledWith(
				UtilityTypes.ELECTRICITY,
			);
		});

		it("should not save when value does not breach threshold", async () => {
			const threshold = aThreshold({
				id: validId("t1"),
				name: validName("Safe Limit"),
				utilityType: UtilityTypes.WATER,
				value: validValue(100),
				thresholdType: ThresholdTypes.ACTUAL,
				thresholdState: ThresholdStates.ENABLED,
				periodType: undefined,
			});
			repository.findActive.mockResolvedValue([threshold]);

			await service.checkRealtimeReadings({
				readings: {
					water: { value: 50 },
				},
				context: {
					thresholdType: ThresholdTypes.ACTUAL,
				},
			});

			expect(uow.executeTransactionally).not.toHaveBeenCalled();
		});

		it("should not call findActive for missing utility data", async () => {
			await service.checkRealtimeReadings({
				readings: {},
				context: {
					thresholdType: ThresholdTypes.ACTUAL,
				},
			});

			expect(repository.findActive).not.toHaveBeenCalled();
		});

		it("should evaluate multiple readings concurrently", async () => {
			const elecThreshold = aThreshold({
				id: validId("t-elec"),
				utilityType: UtilityTypes.ELECTRICITY,
				value: validValue(100),
				thresholdType: ThresholdTypes.ACTUAL,
				thresholdState: ThresholdStates.ENABLED,
				periodType: undefined,
			});
			const waterThreshold = aThreshold({
				id: validId("t-water"),
				utilityType: UtilityTypes.WATER,
				value: validValue(100),
				thresholdType: ThresholdTypes.ACTUAL,
				thresholdState: ThresholdStates.ENABLED,
				periodType: undefined,
			});
			repository.findActive
				.mockResolvedValueOnce([elecThreshold])
				.mockResolvedValueOnce([waterThreshold]);

			await service.checkRealtimeReadings({
				readings: {
					electricity: { value: 150 },
					water: { value: 150 },
				},
				context: {
					thresholdType: ThresholdTypes.ACTUAL,
				},
			});

			expect(uow.executeTransactionally).toHaveBeenCalledTimes(2);
			expect(repository.save).toHaveBeenCalledTimes(2);
			expect(eventPublisher.publish).toHaveBeenCalledTimes(2);
			expect(metrics.recordThresholdBreach).toHaveBeenCalledTimes(2);
		});
	});

	describe("checkForecastReadings()", () => {
		it("should evaluate forecast data points against FORECAST thresholds", async () => {
			const forecastThreshold = aThreshold({
				id: validId("ft1"),
				utilityType: UtilityTypes.ELECTRICITY,
				value: validValue(200),
				thresholdType: ThresholdTypes.FORECAST,
				thresholdState: ThresholdStates.ENABLED,
				periodType: undefined,
			});
			repository.findActive
				.mockResolvedValueOnce([forecastThreshold])
				.mockResolvedValueOnce([]);

			const dataPoints = Array.from({ length: 30 }, (_, i) => ({
				date: new Date(2024, 0, 1 + i),
				value: 250,
			}));
			await service.checkForecastReadings({
				utilityType: UtilityTypes.ELECTRICITY,
				dataPoints,
			});

			expect(uow.executeTransactionally).toHaveBeenCalledTimes(1);
			expect(repository.save).toHaveBeenCalled();
			expect(metrics.recordThresholdBreach).toHaveBeenCalledWith(
				UtilityTypes.ELECTRICITY,
			);
		});

		it("should not breach when forecast value is below threshold", async () => {
			const forecastThreshold = aThreshold({
				id: validId("ft1"),
				utilityType: UtilityTypes.ELECTRICITY,
				value: validValue(200),
				thresholdType: ThresholdTypes.FORECAST,
				thresholdState: ThresholdStates.ENABLED,
				periodType: undefined,
			});
			repository.findActive.mockResolvedValue([forecastThreshold]);

			const dataPoints = Array.from({ length: 30 }, (_, i) => ({
				date: new Date(2024, 0, 1 + i),
				value: 0,
			}));
			await service.checkForecastReadings({
				utilityType: UtilityTypes.ELECTRICITY,
				dataPoints,
			});

			expect(uow.executeTransactionally).not.toHaveBeenCalled();
		});
	});
});
