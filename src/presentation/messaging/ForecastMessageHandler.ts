import type { EvaluationService } from "@application/ports/in/EvaluationService";
import { type UtilityType, UtilityTypes } from "@domain/value/UtilityType";
import type { DlqPublisher } from "@infrastructure/messaging/DlqPublisher";
import type { InboxRepository } from "@infrastructure/persistence/InboxRepository";
import { UnrecoverableError } from "@infrastructure/utils/UnrecoverableError";
import { withRetry } from "@infrastructure/utils/withRetry";
import { trace } from "@opentelemetry/api";
import type { Logger } from "pino";
import { z } from "zod";

const ForecastMessageSchema = z.object({
	eventId: z.string(),
	eventType: z.string().optional(),
	correlationId: z.string().optional(),
	utilityType: z.string(),
	dataPoints: z.array(
		z.object({
			date: z.string(),
			value: z.number(),
		}),
	),
});

function parseUtilityType(raw: string): UtilityType {
	const found = Object.values(UtilityTypes).find((v) => v === raw);
	if (!found) {
		throw new UnrecoverableError(`Unknown utilityType: ${raw}`);
	}
	return found;
}

export class ForecastMessageHandler {
	readonly #logger?: Logger;
	readonly #evaluationService: EvaluationService;
	readonly #inbox: InboxRepository;
	readonly #dlq: DlqPublisher;

	constructor(
		evaluationService: EvaluationService,
		inbox: InboxRepository,
		dlq: DlqPublisher,
		logger?: Logger,
	) {
		this.#evaluationService = evaluationService;
		this.#inbox = inbox;
		this.#dlq = dlq;
		this.#logger = logger;
	}

	async handle(raw: string): Promise<void> {
		let message: z.infer<typeof ForecastMessageSchema>;
		try {
			const json: unknown = JSON.parse(raw);
			message = ForecastMessageSchema.parse(json);
		} catch (err) {
			this.#logger?.warn(
				{ err },
				"Unrecoverable parse failure, routing to DLQ",
			);
			await this.#dlq.publish(
				raw,
				new UnrecoverableError("Parse failure", err),
			);
			return;
		}

		if (
			message.eventType !== undefined &&
			message.eventType !== "ForecastComputed"
		) {
			this.#logger?.warn(
				{ eventType: message.eventType },
				"Unexpected eventType, routing to DLQ",
			);
			await this.#dlq.publish(
				raw,
				new UnrecoverableError(`Unexpected eventType: ${message.eventType}`),
			);
			return;
		}

		const acquired = await this.#inbox.tryAcquire(message.eventId);
		if (!acquired) {
			this.#logger?.debug(
				{ eventId: message.eventId },
				"Duplicate eventId, skipping",
			);
			return;
		}

		const correlationId = message.correlationId ?? message.eventId;
		const childLogger = this.#logger?.child({ correlationId });

		const tracer = trace.getTracer("threshold-service");
		await tracer.startActiveSpan(
			"ForecastMessageHandler.handle",
			{
				attributes: {
					eventId: message.eventId,
					correlationId,
					utilityType: message.utilityType,
				},
			},
			async (span) => {
				try {
					const utilityType = parseUtilityType(message.utilityType);
					const dataPoints = message.dataPoints.map((p) => ({
						date: new Date(p.date),
						value: p.value,
					}));

					await withRetry(() =>
						this.#evaluationService.checkForecastReadings({
							utilityType,
							dataPoints,
						}),
					);
				} catch (err) {
					childLogger?.warn(
						{ err, eventId: message.eventId },
						"Retry exhausted, publishing to DLQ",
					);
					await this.#dlq.publish(raw, err);
				} finally {
					span.end();
				}
			},
		);
	}
}
