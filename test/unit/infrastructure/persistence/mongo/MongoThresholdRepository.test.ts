import { ThresholdNotFoundError } from "@application/errors";
import { Threshold } from "@domain/entity/Threshold";
import { DuplicateThresholdNameError } from "@domain/errors";
import { MongoThresholdRepository } from "@infrastructure/persistence/mongo/MongoThresholdRepository";
import { mongoSessionContext } from "@infrastructure/persistence/mongo/mongoSessionContext";
import {
	type ThresholdDoc,
	ThresholdModel,
} from "@infrastructure/persistence/mongo/ThresholdSchema";
import {
	aThreshold,
	PERIOD,
	TYPE,
	UTILITY,
	validId,
	validName,
} from "@test/domainFactories";
import type { ClientSession } from "mongoose";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@infrastructure/persistence/mongo/ThresholdSchema", () => ({
	ThresholdModel: {
		find: vi.fn(),
		findById: vi.fn(),
		findByIdAndDelete: vi.fn(),
		replaceOne: vi.fn(),
	},
}));

vi.mock("@infrastructure/persistence/mongo/mongoSessionContext", () => ({
	mongoSessionContext: {
		getStore: vi.fn(),
	},
}));

function thresholdDoc(overrides?: Partial<ThresholdDoc>): ThresholdDoc {
	return {
		_id: "threshold-1",
		name: "Test Threshold",
		utilityType: UTILITY,
		value: 100,
		thresholdType: TYPE,
		thresholdState: "ENABLED",
		periodType: PERIOD.value,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	} as ThresholdDoc;
}

function mockExecChain(mockFn: ReturnType<typeof vi.fn>, returnValue: unknown) {
	mockFn.mockReturnValue({
		lean: vi.fn().mockReturnThis(),
		sort: vi.fn().mockReturnThis(),
		exec: vi.fn().mockResolvedValue(returnValue),
	});
}

describe("MongoThresholdRepository", () => {
	let repository: MongoThresholdRepository;
	let mockSession: ClientSession;

	beforeEach(() => {
		vi.clearAllMocks();
		repository = new MongoThresholdRepository();
		mockSession = { id: "test-session" } as unknown as ClientSession;
		vi.mocked(mongoSessionContext.getStore).mockReturnValue(mockSession);
	});

	describe("findAll()", () => {
		it("should return domain Thresholds sorted by createdAt desc", async () => {
			const docs = [
				thresholdDoc({ _id: "id-1", name: "First" }),
				thresholdDoc({ _id: "id-2", name: "Second" }),
			];
			mockExecChain(vi.mocked(ThresholdModel.find), docs);

			const result = await repository.findAll();

			expect(result).toHaveLength(2);
			expect(result[0]).toBeInstanceOf(Threshold);
			expect(result[0].id.value).toBe("id-1");
			expect(result[1].id.value).toBe("id-2");
		});

		it("should return an empty array when no thresholds exist", async () => {
			mockExecChain(vi.mocked(ThresholdModel.find), []);

			const result = await repository.findAll();

			expect(result).toEqual([]);
		});
	});

	describe("findById()", () => {
		it("should return a domain Threshold when the document exists", async () => {
			const doc = thresholdDoc({ _id: "alice-id", name: "Alice" });
			mockExecChain(vi.mocked(ThresholdModel.findById), doc);

			const result = await repository.findById(validId("alice-id"));

			expect(result).toBeInstanceOf(Threshold);
			expect(result?.id.value).toBe("alice-id");
			expect(result?.name.value).toBe("Alice");
		});

		it("should return undefined when the document does not exist", async () => {
			mockExecChain(vi.mocked(ThresholdModel.findById), null);

			const result = await repository.findById(validId("unknown-id"));

			expect(result).toBeUndefined();
		});
	});

	describe("findBreached()", () => {
		it("should return breached thresholds sorted by createdAt desc", async () => {
			const docs = [thresholdDoc({ _id: "b1", thresholdState: "BREACHED" })];
			mockExecChain(vi.mocked(ThresholdModel.find), docs);

			const result = await repository.findBreached();

			expect(result).toHaveLength(1);
			expect(result[0].thresholdState).toBe("BREACHED");
		});
	});

	describe("findActive()", () => {
		it("should find ENABLED thresholds for a given utility and type", async () => {
			const docs = [thresholdDoc()];
			mockExecChain(vi.mocked(ThresholdModel.find), docs);

			const result = await repository.findActive(UTILITY, TYPE);

			expect(result).toHaveLength(1);
			expect(ThresholdModel.find).toHaveBeenCalledWith({
				utilityType: UTILITY,
				thresholdType: TYPE,
				thresholdState: "ENABLED",
			});
		});

		it("should include periodType filter when provided", async () => {
			const docs = [thresholdDoc()];
			mockExecChain(vi.mocked(ThresholdModel.find), docs);

			await repository.findActive(UTILITY, TYPE, PERIOD);

			expect(ThresholdModel.find).toHaveBeenCalledWith({
				utilityType: UTILITY,
				thresholdType: TYPE,
				thresholdState: "ENABLED",
				periodType: PERIOD.value,
			});
		});
	});

	describe("findByFilters()", () => {
		it("should build query from provided filters", async () => {
			const docs: ThresholdDoc[] = [];
			mockExecChain(vi.mocked(ThresholdModel.find), docs);

			await repository.findByFilters({
				name: validName("threshold-1"),
				utilityType: UTILITY,
				thresholdType: TYPE,
			});

			expect(ThresholdModel.find).toHaveBeenCalledWith({
				name: "threshold-1",
				utilityType: UTILITY,
				thresholdType: TYPE,
			});
		});

		it("should return empty array when no results match", async () => {
			mockExecChain(vi.mocked(ThresholdModel.find), []);

			const result = await repository.findByFilters({});

			expect(result).toEqual([]);
		});
	});

	describe("save()", () => {
		it("should upsert the threshold document within the active session", async () => {
			vi.mocked(ThresholdModel.replaceOne).mockReturnValue({
				exec: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
			} as never);
			const threshold = aThreshold();

			await repository.save(threshold);

			expect(ThresholdModel.replaceOne).toHaveBeenCalledWith(
				{ _id: "threshold-1" },
				expect.objectContaining({
					_id: "threshold-1",
					name: "Test Threshold",
				}),
				{ upsert: true, runValidators: true, session: mockSession },
			);
		});

		it("should throw DuplicateThresholdNameError on duplicate key error", async () => {
			vi.mocked(ThresholdModel.replaceOne).mockReturnValue({
				exec: vi.fn().mockRejectedValue(
					new mongoose.mongo.MongoServerError({
						code: 11000,
						message: "duplicate key",
					}),
				),
			} as never);
			const threshold = aThreshold();

			await expect(repository.save(threshold)).rejects.toThrow(
				DuplicateThresholdNameError,
			);
		});

		it("should rethrow unexpected database errors", async () => {
			const dbError = new Error("connection lost");
			vi.mocked(ThresholdModel.replaceOne).mockReturnValue({
				exec: vi.fn().mockRejectedValue(dbError),
			} as never);

			await expect(repository.save(aThreshold())).rejects.toThrow(
				"connection lost",
			);
		});
	});

	describe("remove()", () => {
		it("should delete the threshold by id within the active session", async () => {
			vi.mocked(ThresholdModel.findByIdAndDelete).mockReturnValue({
				exec: vi.fn().mockResolvedValue({ _id: "threshold-1" }),
			} as never);
			const threshold = aThreshold();

			await repository.remove(threshold);

			expect(ThresholdModel.findByIdAndDelete).toHaveBeenCalledWith(
				"threshold-1",
				{ session: mockSession },
			);
		});

		it("should throw ThresholdNotFoundError when document does not exist", async () => {
			vi.mocked(ThresholdModel.findByIdAndDelete).mockReturnValue({
				exec: vi.fn().mockResolvedValue(null),
			} as never);
			const threshold = aThreshold();

			await expect(repository.remove(threshold)).rejects.toThrow(
				ThresholdNotFoundError,
			);
		});

		it("should rethrow database errors on remove", async () => {
			const dbError = new Error("delete failed");
			vi.mocked(ThresholdModel.findByIdAndDelete).mockReturnValue({
				exec: vi.fn().mockRejectedValue(dbError),
			} as never);

			await expect(repository.remove(aThreshold())).rejects.toThrow(
				"delete failed",
			);
		});
	});
});
