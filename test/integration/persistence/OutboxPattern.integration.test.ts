import type { Threshold } from "@domain/entity/Threshold";
import { DuplicateThresholdNameError } from "@domain/errors";
import { ThresholdBreachedEvent } from "@domain/events/ThresholdBreachedEvent";
import { MongoOutboxEventPublisher } from "@infrastructure/events/MongoOutboxEventPublisher";
import { MongoThresholdRepository } from "@infrastructure/persistence/mongo/MongoThresholdRepository";
import { MongoUnitOfWork } from "@infrastructure/persistence/mongo/MongoUnitOfWork";
import {
	type OutboxEventDoc,
	OutboxEventModel,
} from "@infrastructure/persistence/mongo/OutboxEventSchema";
import { ThresholdModel } from "@infrastructure/persistence/mongo/ThresholdSchema";
import { clearDatabase, startMongo, stopMongo } from "@test/mongoSetup";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
	aNewThreshold,
	PERIOD,
	seedThreshold,
	TYPE,
	UTILITY,
	validId,
	validName,
} from "./fixtures";

describe("Outbox Pattern (integration)", () => {
	let uow: MongoUnitOfWork;
	let repository: MongoThresholdRepository;
	let eventPublisher: MongoOutboxEventPublisher;

	beforeAll(async () => {
		await startMongo();
		uow = new MongoUnitOfWork();
		repository = new MongoThresholdRepository();
		eventPublisher = new MongoOutboxEventPublisher();
		await OutboxEventModel.createCollection();
		await ThresholdModel.createCollection();
	});

	afterAll(async () => {
		await stopMongo();
	});

	beforeEach(async () => {
		await clearDatabase();
	});

	const saveWithOutbox = async (threshold: Threshold): Promise<void> => {
		await uow.executeTransactionally(async () => {
			await repository.save(threshold);
			for (const event of threshold.pullDomainEvents()) {
				await eventPublisher.publish(event);
			}
		});
	};

	const findAllOutboxEvents = async (): Promise<OutboxEventDoc[]> => {
		return OutboxEventModel.find({}).sort({ createdAt: 1 }).lean().exec();
	};

	it("persists threshold update and outbox event atomically on breach", async () => {
		await seedThreshold("threshold-1", "Breach Test");
		const saved = await repository.findById(validId("threshold-1"));
		if (!saved) return;

		saved.check(200);

		await saveWithOutbox(saved);

		const updated = await ThresholdModel.findById("threshold-1").lean().exec();
		expect(updated).not.toBeNull();
		if (!updated) return;
		expect(updated.thresholdState).toBe("BREACHED");

		const outboxDocs = await findAllOutboxEvents();
		expect(outboxDocs).toHaveLength(1);
		expect(outboxDocs[0]).toMatchObject({
			eventType: "ThresholdBreachedEvent",
			aggregateId: "threshold-1",
			aggregateType: "Threshold",
			payload: {
				thresholdId: "threshold-1",
				thresholdName: "Breach Test",
				utilityType: UTILITY,
				thresholdType: TYPE,
				limitValue: 100,
				detectedValue: 200,
				periodType: PERIOD.value,
			},
		});
	});

	it("rolls back both threshold and outbox events on duplicate name", async () => {
		await seedThreshold("existing-id", "taken-name");

		const conflicting = aNewThreshold({
			id: validId("other-id"),
			name: validName("taken-name"),
		});

		await expect(saveWithOutbox(conflicting)).rejects.toThrow(
			DuplicateThresholdNameError,
		);

		const doc = await ThresholdModel.findById("other-id").lean().exec();
		expect(doc).toBeNull();

		const outboxDocs = await OutboxEventModel.find({
			aggregateId: "other-id",
		})
			.lean()
			.exec();
		expect(outboxDocs).toHaveLength(0);
	});

	it("throws if event publisher is called outside a UnitOfWork", async () => {
		const event = new ThresholdBreachedEvent(
			validId("threshold-1"),
			validName("Test"),
			UTILITY,
			TYPE,
			100,
			200,
			PERIOD,
		);

		await expect(eventPublisher.publish(event)).rejects.toThrow(
			"EventPublisher must always be called inside an UnitOfWork",
		);
	});

	it("does not publish an event when the threshold is not breached", async () => {
		await seedThreshold("threshold-1", "No Breach");
		const saved = await repository.findById(validId("threshold-1"));
		if (!saved) return;

		saved.check(50);

		await saveWithOutbox(saved);

		const outboxDocs = await findAllOutboxEvents();
		expect(outboxDocs).toHaveLength(0);
	});

	it("does not publish an event when the threshold is disabled", async () => {
		await seedThreshold("threshold-1", "Disabled", UTILITY, TYPE, "DISABLED");
		const saved = await repository.findById(validId("threshold-1"));
		if (!saved) return;

		saved.check(200);

		await saveWithOutbox(saved);

		const outboxDocs = await findAllOutboxEvents();
		expect(outboxDocs).toHaveLength(0);
	});

	it("publishes multiple breach events across separate transactions", async () => {
		await seedThreshold("threshold-1", "Multi Breach");
		const first = await repository.findById(validId("threshold-1"));
		if (!first) return;

		first.check(200);
		await saveWithOutbox(first);

		const second = await repository.findById(validId("threshold-1"));
		if (!second) return;

		second.reset();
		second.check(300);
		await saveWithOutbox(second);

		const outboxDocs = await findAllOutboxEvents();
		expect(outboxDocs).toHaveLength(2);
		expect(outboxDocs[0].eventType).toBe("ThresholdBreachedEvent");
		expect(outboxDocs[0].payload.detectedValue).toBe(200);
		expect(outboxDocs[1].eventType).toBe("ThresholdBreachedEvent");
		expect(outboxDocs[1].payload.detectedValue).toBe(300);
	});
});
