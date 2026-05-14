import { ThresholdNotFoundError } from "@application/errors";
import { Threshold } from "@domain/entity/Threshold";
import { DuplicateThresholdNameError } from "@domain/errors";
import { ThresholdStates } from "@domain/value/ThresholdState";
import { ThresholdTypes } from "@domain/value/ThresholdType";
import { UtilityTypes } from "@domain/value/UtilityType";
import { MongoThresholdRepository } from "@infrastructure/persistence/mongo/MongoThresholdRepository";
import { ThresholdModel } from "@infrastructure/persistence/mongo/ThresholdSchema";
import {
	aNewThreshold,
	aThreshold,
	PERIOD,
	seedThreshold,
	TYPE,
	UTILITY,
	validId,
	validName,
} from "@test/integration/persistence/fixtures";
import { clearDatabase, startMongo, stopMongo } from "@test/mongoSetup";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("MongoThresholdRepository (integration)", () => {
	let repository: MongoThresholdRepository;

	beforeAll(async () => {
		await startMongo();
		repository = new MongoThresholdRepository();
		await ThresholdModel.createCollection();
	});

	afterAll(async () => {
		await stopMongo();
	});

	beforeEach(async () => {
		await clearDatabase();
	});

	describe("findById()", () => {
		it("returns a domain Threshold when the document exists", async () => {
			await seedThreshold("threshold-1", "Threshold A");

			const result = await repository.findById(validId("threshold-1"));

			expect(result).toBeInstanceOf(Threshold);
			if (!result) return;
			expect(result.id.value).toBe("threshold-1");
			expect(result.name.value).toBe("Threshold A");
			expect(result.utilityType).toBe(UTILITY);
		});

		it("returns undefined when the document does not exist", async () => {
			const result = await repository.findById(validId("unknown-id"));

			expect(result).toBeUndefined();
		});
	});

	describe("findAll()", () => {
		it("returns all thresholds", async () => {
			await seedThreshold("id-1", "First");
			await seedThreshold("id-2", "Second");

			const result = await repository.findAll();

			expect(result).toHaveLength(2);
			expect(result[0]).toBeInstanceOf(Threshold);
			expect(result[1]).toBeInstanceOf(Threshold);
		});

		it("returns an empty array when no thresholds exist", async () => {
			const result = await repository.findAll();

			expect(result).toEqual([]);
		});
	});

	describe("findBreached()", () => {
		it("returns only thresholds in BREACHED state", async () => {
			await seedThreshold(
				"id-1",
				"Breached One",
				UTILITY,
				TYPE,
				ThresholdStates.BREACHED,
			);
			await seedThreshold("id-2", "Enabled One");

			const result = await repository.findBreached();

			expect(result).toHaveLength(1);
			expect(result[0]).toBeInstanceOf(Threshold);
			expect(result[0].id.value).toBe("id-1");
			expect(result[0].thresholdState).toBe("BREACHED");
		});

		it("returns an empty array when no thresholds are breached", async () => {
			await seedThreshold("id-1", "Enabled One");

			const result = await repository.findBreached();

			expect(result).toEqual([]);
		});
	});

	describe("findActive()", () => {
		it("returns ENABLED thresholds matching utility and type", async () => {
			await seedThreshold("id-1", "Electricity Historical");
			await seedThreshold(
				"id-2",
				"Electricity Forecast",
				UTILITY,
				ThresholdTypes.FORECAST,
			);
			await seedThreshold(
				"id-3",
				"Electricity Disabled",
				UTILITY,
				TYPE,
				ThresholdStates.DISABLED,
			);

			const result = await repository.findActive(UTILITY, TYPE);

			expect(result).toHaveLength(1);
			expect(result[0].id.value).toBe("id-1");
		});

		it("returns empty array when no matching active thresholds exist", async () => {
			await seedThreshold("id-1", "Enabled", UTILITY, TYPE);

			const result = await repository.findActive(UtilityTypes.WATER, TYPE);

			expect(result).toEqual([]);
		});

		it("filters by periodType when provided", async () => {
			await ThresholdModel.create({
				_id: "id-1",
				name: "One Day",
				utilityType: UTILITY,
				value: 100,
				thresholdType: TYPE,
				thresholdState: "ENABLED",
				periodType: "ONE_DAY",
			});
			await ThresholdModel.create({
				_id: "id-2",
				name: "One Week",
				utilityType: UTILITY,
				value: 100,
				thresholdType: TYPE,
				thresholdState: "ENABLED",
				periodType: "ONE_WEEK",
			});

			const result = await repository.findActive(UTILITY, TYPE, PERIOD);

			expect(result).toHaveLength(1);
			expect(result[0].id.value).toBe("id-1");
		});
	});

	describe("findByFilters()", () => {
		it("filters by name", async () => {
			await seedThreshold("id-1", "Target");
			await seedThreshold("id-2", "Other");

			const result = await repository.findByFilters({
				name: validName("Target"),
			});

			expect(result).toHaveLength(1);
			expect(result[0].id.value).toBe("id-1");
		});

		it("filters by state", async () => {
			await seedThreshold(
				"id-1",
				"Breached",
				UTILITY,
				TYPE,
				ThresholdStates.BREACHED,
			);
			await seedThreshold("id-2", "Enabled");

			const result = await repository.findByFilters({
				state: ThresholdStates.BREACHED,
			});

			expect(result).toHaveLength(1);
			expect(result[0].id.value).toBe("id-1");
		});

		it("combines multiple filters", async () => {
			await seedThreshold("id-1", "Target", UTILITY, TYPE);
			await seedThreshold(
				"id-2",
				"Breached Target",
				UTILITY,
				TYPE,
				ThresholdStates.BREACHED,
			);
			await seedThreshold("id-3", "Other", UTILITY, ThresholdTypes.FORECAST);

			const result = await repository.findByFilters({
				name: validName("Breached Target"),
				state: ThresholdStates.BREACHED,
			});

			expect(result).toHaveLength(1);
			expect(result[0].id.value).toBe("id-2");
		});

		it("returns empty array when no results match", async () => {
			await seedThreshold("id-1", "Enabled");

			const result = await repository.findByFilters({
				name: validName("Nonexistent"),
			});

			expect(result).toEqual([]);
		});
	});

	describe("save()", () => {
		it("creates a new threshold document", async () => {
			const threshold = aNewThreshold({
				id: validId("new-id"),
				name: validName("New Threshold"),
			});

			await repository.save(threshold);

			const doc = await ThresholdModel.findById("new-id").lean().exec();
			expect(doc).not.toBeNull();
			if (!doc) return;
			expect(doc.name).toBe("New Threshold");
			expect(doc.utilityType).toBe(UTILITY);
			expect(doc.value).toBe(100);
		});

		it("updates an existing threshold document", async () => {
			await seedThreshold("threshold-1", "Old Name");
			const threshold = aThreshold({
				id: validId("threshold-1"),
				name: validName("New Name"),
			});

			await repository.save(threshold);

			const doc = await ThresholdModel.findById("threshold-1").lean().exec();
			if (!doc) return;
			expect(doc.name).toBe("New Name");
		});

		it("throws DuplicateThresholdNameError on duplicate name", async () => {
			await seedThreshold("threshold-1", "Taken Name");
			const threshold = aNewThreshold({
				id: validId("threshold-2"),
				name: validName("Taken Name"),
			});

			await expect(repository.save(threshold)).rejects.toThrow(
				DuplicateThresholdNameError,
			);
		});
	});

	describe("remove()", () => {
		it("deletes the threshold document", async () => {
			await seedThreshold("threshold-1", "To Delete");

			await repository.remove(aThreshold());

			const doc = await ThresholdModel.findById("threshold-1").lean().exec();
			expect(doc).toBeNull();
		});

		it("throws ThresholdNotFoundError when document does not exist", async () => {
			await expect(repository.remove(aThreshold())).rejects.toThrow(
				ThresholdNotFoundError,
			);
		});
	});
});
