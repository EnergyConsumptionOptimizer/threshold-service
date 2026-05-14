import { ThresholdNotFoundError } from "@application/errors";
import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import type { IdGenerator } from "@application/ports/out/IdGenerator";
import { ThresholdServiceImpl } from "@application/services/ThresholdServiceImpl";
import {
	ActualThresholdWithPeriodError,
	DuplicateThresholdNameError,
	InvalidThresholdIdError,
	InvalidThresholdNameError,
	InvalidThresholdValueError,
	MissingPeriodTypeForThresholdError,
} from "@domain/errors";
import type { ThresholdRepository } from "@domain/ports/ThresholdRepository";
import type { UniqueThresholdNameChecker } from "@domain/services/UniqueThresholdNameChecker";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdStates } from "@domain/value/ThresholdState";
import { ThresholdTypes } from "@domain/value/ThresholdType";
import { UtilityTypes } from "@domain/value/UtilityType";
import {
	aThreshold,
	validId,
	validName,
	validValue,
} from "@test/domainFactories";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type MockProxy, mock } from "vitest-mock-extended";

describe("ThresholdServiceImpl", () => {
	let repository: MockProxy<ThresholdRepository>;
	let idGenerator: MockProxy<IdGenerator>;
	let metrics: MockProxy<BusinessMetricsPort>;
	let nameUniqueness: MockProxy<UniqueThresholdNameChecker>;
	let service: ThresholdServiceImpl;

	beforeEach(() => {
		repository = mock<ThresholdRepository>();
		idGenerator = mock<IdGenerator>();
		metrics = mock<BusinessMetricsPort>();
		nameUniqueness = mock<UniqueThresholdNameChecker>();

		idGenerator.generate.mockReturnValue("generated-id");
		repository.save.mockImplementation(async () => {});
		repository.remove.mockImplementation(async () => {});
		nameUniqueness.ensureAvailable.mockResolvedValue(undefined);

		service = new ThresholdServiceImpl(
			repository,
			idGenerator,
			metrics,
			nameUniqueness,
		);
	});

	describe("create()", () => {
		it("should create a threshold and record metrics", async () => {
			const result = await service.create({
				name: "Test Threshold",
				utilityType: UtilityTypes.ELECTRICITY,
				value: 100,
				thresholdType: ThresholdTypes.ACTUAL,
			});

			expect(result).not.toBeInstanceOf(Error);
			if (result instanceof Error) return;
			expect(result).toMatchObject({
				id: "generated-id",
				name: "Test Threshold",
				utilityType: "ELECTRICITY",
				value: 100,
				thresholdType: "ACTUAL",
				thresholdState: "ENABLED",
			});
			expect(repository.save).toHaveBeenCalled();
			expect(metrics.recordThresholdCreation).toHaveBeenCalled();
		});

		it("should create a HISTORICAL threshold with period type", async () => {
			const result = await service.create({
				name: "Historical Threshold",
				utilityType: UtilityTypes.GAS,
				value: 200,
				thresholdType: ThresholdTypes.HISTORICAL,
				periodType: PeriodType.ONE_DAY,
			});

			expect(result).not.toBeInstanceOf(Error);
			if (result instanceof Error) return;
			expect(result).toMatchObject({
				thresholdType: "HISTORICAL",
				periodType: "ONE_DAY",
			});
		});

		it("should return InvalidThresholdNameError when name is empty", async () => {
			const result = await service.create({
				name: "",
				utilityType: UtilityTypes.WATER,
				value: 50,
				thresholdType: ThresholdTypes.ACTUAL,
			});

			expect(result).toBeInstanceOf(InvalidThresholdNameError);
		});

		it("should return InvalidThresholdNameError when name is whitespace", async () => {
			const result = await service.create({
				name: "   ",
				utilityType: UtilityTypes.WATER,
				value: 50,
				thresholdType: ThresholdTypes.ACTUAL,
			});

			expect(result).toBeInstanceOf(InvalidThresholdNameError);
		});

		it("should return InvalidThresholdValueError when value is zero", async () => {
			const result = await service.create({
				name: "Test",
				utilityType: UtilityTypes.WATER,
				value: 0,
				thresholdType: ThresholdTypes.ACTUAL,
			});

			expect(result).toBeInstanceOf(InvalidThresholdValueError);
		});

		it("should return InvalidThresholdValueError when value is negative", async () => {
			const result = await service.create({
				name: "Test",
				utilityType: UtilityTypes.WATER,
				value: -10,
				thresholdType: ThresholdTypes.ACTUAL,
			});

			expect(result).toBeInstanceOf(InvalidThresholdValueError);
		});

		it("should return ActualThresholdWithPeriodError when ACTUAL has period", async () => {
			const result = await service.create({
				name: "Test",
				utilityType: UtilityTypes.WATER,
				value: 50,
				thresholdType: ThresholdTypes.ACTUAL,
				periodType: PeriodType.ONE_DAY,
			});

			expect(result).toBeInstanceOf(ActualThresholdWithPeriodError);
		});

		it("should return MissingPeriodTypeForThresholdError when HISTORICAL lacks period", async () => {
			const result = await service.create({
				name: "Test",
				utilityType: UtilityTypes.WATER,
				value: 50,
				thresholdType: ThresholdTypes.HISTORICAL,
			});

			expect(result).toBeInstanceOf(MissingPeriodTypeForThresholdError);
		});

		it("should return DuplicateThresholdNameError when name already exists", async () => {
			nameUniqueness.ensureAvailable.mockResolvedValue(
				new DuplicateThresholdNameError("Duplicate"),
			);

			const result = await service.create({
				name: "Duplicate",
				utilityType: UtilityTypes.WATER,
				value: 50,
				thresholdType: ThresholdTypes.ACTUAL,
			});

			expect(result).toBeInstanceOf(DuplicateThresholdNameError);
			expect(repository.save).not.toHaveBeenCalled();
		});
	});

	describe("getById()", () => {
		it("should return threshold output when found", async () => {
			const threshold = aThreshold({
				id: validId("found-id"),
				name: validName("My Threshold"),
				utilityType: UtilityTypes.ELECTRICITY,
			});
			repository.findById.mockResolvedValue(threshold);

			const result = await service.getById("found-id");

			expect(result).not.toBeInstanceOf(Error);
			if (result instanceof Error) return;
			expect(result).toMatchObject({
				id: "found-id",
				name: "My Threshold",
				utilityType: "ELECTRICITY",
			});
		});

		it("should return ThresholdNotFoundError when threshold does not exist", async () => {
			repository.findById.mockResolvedValue(undefined);

			const result = await service.getById("unknown-id");

			expect(result).toBeInstanceOf(ThresholdNotFoundError);
		});

		it("should return InvalidThresholdIdError when id is empty", async () => {
			const result = await service.getById("");

			expect(result).toBeInstanceOf(InvalidThresholdIdError);
		});
	});

	describe("list()", () => {
		it("should return list of threshold outputs", async () => {
			const thresholds = [
				aThreshold({
					id: validId("id-1"),
					name: validName("First"),
				}),
				aThreshold({
					id: validId("id-2"),
					name: validName("Second"),
				}),
			];
			repository.findByFilters.mockResolvedValue(thresholds);

			const result = await service.list({});

			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({ id: "id-1", name: "First" });
			expect(result[1]).toMatchObject({ id: "id-2", name: "Second" });
		});

		it("should return empty array when no thresholds exist", async () => {
			repository.findByFilters.mockResolvedValue([]);

			const result = await service.list({});

			expect(result).toEqual([]);
		});
	});

	describe("update()", () => {
		it("should update threshold name and record metrics", async () => {
			const threshold = aThreshold({
				id: validId("update-id"),
				name: validName("Old Name"),
			});
			repository.findById.mockResolvedValue(threshold);

			const result = await service.update("update-id", {
				name: "New Name",
			});

			expect(result).not.toBeInstanceOf(Error);
			if (result instanceof Error) return;
			expect(result.name).toBe("New Name");
			expect(repository.save).toHaveBeenCalled();
			expect(metrics.recordThresholdUpdate).toHaveBeenCalled();
		});

		it("should allow updating to the same name", async () => {
			const threshold = aThreshold({
				id: validId("update-id"),
				name: validName("Same Name"),
			});
			repository.findById.mockResolvedValue(threshold);

			const result = await service.update("update-id", {
				name: "Same Name",
			});

			expect(result).not.toBeInstanceOf(Error);
			if (result instanceof Error) return;
			expect(result.name).toBe("Same Name");
			expect(nameUniqueness.ensureAvailable).not.toHaveBeenCalled();
		});

		it("should return DuplicateThresholdNameError when new name is taken", async () => {
			const threshold = aThreshold({
				id: validId("update-id"),
				name: validName("Old Name"),
			});
			repository.findById.mockResolvedValue(threshold);
			nameUniqueness.ensureAvailable.mockResolvedValue(
				new DuplicateThresholdNameError("Taken Name"),
			);

			const result = await service.update("update-id", {
				name: "Taken Name",
			});

			expect(result).toBeInstanceOf(DuplicateThresholdNameError);
			expect(repository.save).not.toHaveBeenCalled();
		});

		it("should update threshold value", async () => {
			const threshold = aThreshold({
				id: validId("update-id"),
				value: validValue(100),
			});
			repository.findById.mockResolvedValue(threshold);

			const result = await service.update("update-id", {
				value: 200,
			});

			expect(result).not.toBeInstanceOf(Error);
			if (result instanceof Error) return;
			expect(result.value).toBe(200);
		});

		it("should update threshold state to DISABLED", async () => {
			const threshold = aThreshold({
				id: validId("update-id"),
				thresholdState: ThresholdStates.ENABLED,
			});
			repository.findById.mockResolvedValue(threshold);

			const result = await service.update("update-id", {
				thresholdState: ThresholdStates.DISABLED,
			});

			expect(result).not.toBeInstanceOf(Error);
			if (result instanceof Error) return;
			expect(result.thresholdState).toBe("DISABLED");
		});

		it("should return ThresholdNotFoundError when threshold does not exist", async () => {
			repository.findById.mockResolvedValue(undefined);

			const result = await service.update("unknown-id", {
				name: "New Name",
			});

			expect(result).toBeInstanceOf(ThresholdNotFoundError);
		});

		it("should return InvalidThresholdIdError when id is empty", async () => {
			const result = await service.update("", { name: "New Name" });

			expect(result).toBeInstanceOf(InvalidThresholdIdError);
		});

		it("should return InvalidThresholdNameError when new name is empty", async () => {
			const threshold = aThreshold({
				id: validId("update-id"),
				name: validName("Old Name"),
			});
			repository.findById.mockResolvedValue(threshold);

			const result = await service.update("update-id", { name: "" });

			expect(result).toBeInstanceOf(InvalidThresholdNameError);
		});

		it("should return InvalidThresholdValueError when new value is not positive", async () => {
			const threshold = aThreshold({
				id: validId("update-id"),
				value: validValue(100),
			});
			repository.findById.mockResolvedValue(threshold);

			const result = await service.update("update-id", { value: 0 });

			expect(result).toBeInstanceOf(InvalidThresholdValueError);
		});
	});

	describe("delete()", () => {
		it("should delete threshold and record metrics", async () => {
			const threshold = aThreshold({
				id: validId("delete-id"),
			});
			repository.findById.mockResolvedValue(threshold);

			const result = await service.delete("delete-id");

			expect(result).toBeUndefined();
			expect(repository.remove).toHaveBeenCalled();
			expect(metrics.recordThresholdDeletion).toHaveBeenCalled();
		});

		it("should return ThresholdNotFoundError when threshold does not exist", async () => {
			repository.findById.mockResolvedValue(undefined);

			const result = await service.delete("unknown-id");

			expect(result).toBeInstanceOf(ThresholdNotFoundError);
		});

		it("should return InvalidThresholdIdError when id is empty", async () => {
			const result = await service.delete("");

			expect(result).toBeInstanceOf(InvalidThresholdIdError);
		});
	});

	describe("reset()", () => {
		it("should reset breached thresholds and record metrics", async () => {
			const monday = new Date("2026-05-04");
			const breachedOneDay = aThreshold({
				id: validId("breached-1"),
				thresholdState: ThresholdStates.BREACHED,
				periodType: PeriodType.ONE_DAY,
			});
			const notBreached = aThreshold({
				id: validId("ok-1"),
				thresholdState: ThresholdStates.ENABLED,
				periodType: PeriodType.ONE_DAY,
			});

			repository.findAll.mockResolvedValue([breachedOneDay, notBreached]);

			vi.useFakeTimers();
			vi.setSystemTime(monday);

			const result = await service.reset();

			vi.useRealTimers();

			expect(result).not.toBeInstanceOf(Error);
			if (result instanceof Error) return;
			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				id: "breached-1",
				thresholdState: "ENABLED",
			});
			expect(metrics.recordThresholdUpdate).toHaveBeenCalledTimes(1);
		});

		it("should reset no thresholds when none are eligible", async () => {
			const tuesday = new Date("2026-05-05");
			const breachedOneWeek = aThreshold({
				id: validId("breached-week"),
				thresholdState: ThresholdStates.BREACHED,
				periodType: PeriodType.ONE_WEEK,
			});

			repository.findAll.mockResolvedValue([breachedOneWeek]);

			vi.useFakeTimers();
			vi.setSystemTime(tuesday);

			const result = await service.reset();

			vi.useRealTimers();

			expect(result).toHaveLength(0);
		});
	});
});
