import { randomUUID } from "node:crypto";
import type { EventPublisher } from "@application/ports/out/EventPublisher";
import type { DomainEvent } from "@domain/events/DomainEvent";
import { EventEnvelope } from "@infrastructure/events/EventEnvelope";
import { mongoSessionContext } from "@infrastructure/persistence/mongo/mongoSessionContext";
import { OutboxEventModel } from "@infrastructure/persistence/mongo/OutboxEventSchema";
import { trace } from "@opentelemetry/api";
import type { Logger } from "pino";

export class MongoOutboxEventPublisher implements EventPublisher {
	readonly #logger?: Logger;

	constructor(logger?: Logger) {
		this.#logger = logger;
	}

	async publish(event: DomainEvent): Promise<void> {
		const session = mongoSessionContext.getStore();
		if (!session) {
			throw new Error(
				"EventPublisher must always be called inside an UnitOfWork",
			);
		}

		const activeSpan = trace.getActiveSpan();

		const envelope = new EventEnvelope({
			event,
			eventId: randomUUID(),
			correlationId: activeSpan?.spanContext().traceId,
		});

		this.#logger?.debug(
			{
				eventType: envelope.event.eventType,
				aggregateId: envelope.event.aggregateId,
				eventId: envelope.eventId,
				correlationId: envelope.correlationId,
			},
			"publishing outbox event",
		);

		await OutboxEventModel.create(
			[
				{
					eventId: envelope.eventId,
					aggregateId: envelope.event.aggregateId,
					aggregateType: envelope.event.aggregateType,
					eventType: envelope.event.eventType,
					occurredAt: envelope.event.occurredAt,
					payload: envelope.event.payload,
					correlationId: envelope.correlationId,
				},
			],
			{ session },
		);
	}
}
