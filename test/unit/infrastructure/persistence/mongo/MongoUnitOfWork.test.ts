import { MongoUnitOfWork } from "@infrastructure/persistence/mongo/MongoUnitOfWork";
import { mongoSessionContext } from "@infrastructure/persistence/mongo/mongoSessionContext";
import type { ClientSession } from "mongoose";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("mongoose", () => ({
	default: {
		startSession: vi.fn(),
	},
}));

vi.mock("@infrastructure/persistence/mongo/mongoSessionContext", () => ({
	mongoSessionContext: {
		run: vi.fn(),
	},
}));

describe("MongoUnitOfWork", () => {
	let uow: MongoUnitOfWork;

	beforeEach(() => {
		vi.clearAllMocks();
		uow = new MongoUnitOfWork();
	});

	describe("executeTransactionally()", () => {
		it("should run the operation within a transaction and return its result", async () => {
			const mockSession = {
				withTransaction: vi
					.fn()
					.mockImplementation(async (fn: () => Promise<unknown>) => fn()),
				endSession: vi.fn().mockResolvedValue(undefined),
			} as unknown as ClientSession;

			vi.mocked(mongoose.startSession).mockResolvedValue(mockSession);
			vi.mocked(mongoSessionContext.run).mockImplementation((_ctx, fn) =>
				(fn as () => Promise<unknown>)(),
			);
			const operation = vi.fn().mockResolvedValue("result-value");

			const result = await uow.executeTransactionally(
				operation as unknown as () => Promise<unknown>,
			);

			expect(result).toBe("result-value");
			expect(mongoose.startSession).toHaveBeenCalled();
			expect(mockSession.withTransaction).toHaveBeenCalled();
			expect(mockSession.endSession).toHaveBeenCalled();
			expect(operation).toHaveBeenCalled();
		});

		it("should end the session even when the operation throws", async () => {
			const mockSession = {
				withTransaction: vi
					.fn()
					.mockRejectedValue(new Error("operation failed")),
				endSession: vi.fn().mockResolvedValue(undefined),
			} as unknown as ClientSession;

			vi.mocked(mongoose.startSession).mockResolvedValue(mockSession);

			await expect(uow.executeTransactionally(vi.fn())).rejects.toThrow(
				"operation failed",
			);

			expect(mockSession.endSession).toHaveBeenCalled();
		});
	});
});
