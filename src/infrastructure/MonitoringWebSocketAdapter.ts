import type {
	EvaluationContext,
	EvaluationService,
} from "@application/ports/in/EvaluationService";
import { PeriodType } from "@domain/value/PeriodType";
import {
	type ThresholdType,
	ThresholdTypes,
} from "@domain/value/ThresholdType";
import {
	type UtilityMetersQueryResultDTO,
	utilityMetersUpdateSchema,
} from "@infrastructure/contracts/utilityMetersQueryResultSchema";
import type { Logger } from "pino";
import { io, type Socket } from "socket.io-client";

const NAMESPACE = "/utility-meters";

const SUBSCRIPTION_QUERIES = [
	{ label: "realtime" },
	{ label: "day", filter: { from: "1day" } },
	{ label: "week", filter: { from: "1week" } },
	{ label: "month", filter: { from: "1month" } },
];

const LABEL_TO_CONTEXT: Record<string, EvaluationContext> = {
	realtime: { thresholdType: ThresholdTypes.ACTUAL as ThresholdType },
	day: {
		thresholdType: ThresholdTypes.HISTORICAL as ThresholdType,
		periodType: PeriodType.ONE_DAY,
	},
	week: {
		thresholdType: ThresholdTypes.HISTORICAL as ThresholdType,
		periodType: PeriodType.ONE_WEEK,
	},
	month: {
		thresholdType: ThresholdTypes.HISTORICAL as ThresholdType,
		periodType: PeriodType.ONE_MONTH,
	},
};

export class MonitoringWebSocketAdapter {
	#socket: Socket | null = null;
	readonly #logger?: Logger;
	readonly #monitoringServiceUrl: string;
	readonly #evaluationService: EvaluationService;

	constructor(
		monitoringServiceUrl: string,
		evaluationService: EvaluationService,
		logger?: Logger,
	) {
		this.#monitoringServiceUrl = monitoringServiceUrl;
		this.#evaluationService = evaluationService;
		this.#logger = logger;
	}

	connect(): void {
		const url = this.#monitoringServiceUrl + NAMESPACE;

		this.#socket = io(url, {
			reconnection: true,
			transports: ["websocket"],
		});

		this.#socket.on("connect", () => {
			this.#logger?.info({ url }, "Connected");
			this.#socket?.emit("subscribe", SUBSCRIPTION_QUERIES);
		});

		this.#socket.on("disconnect", (reason: string) => {
			this.#logger?.info({ reason }, "Disconnected");
		});

		this.#socket.on("connect_error", (err: Error) => {
			this.#logger?.warn({ err: err.message }, "Connection error");
		});

		this.#socket.on("utilityMetersUpdate", (data: unknown) => {
			this.handleMessage(data).catch((err: unknown) => {
				this.#logger?.error({ err }, "Error processing message");
			});
		});
	}

	disconnect(): void {
		this.#socket?.removeAllListeners();
		this.#socket?.disconnect();
		this.#socket = null;
	}

	public async handleMessage(data: unknown): Promise<void> {
		const parsed = utilityMetersUpdateSchema.safeParse(data);

		if (!parsed.success) {
			this.#logger?.warn(
				{ error: parsed.error.message },
				"Invalid utilityMetersUpdate payload — discarded",
			);
			return;
		}

		await Promise.all(parsed.data.map((item) => this.processItem(item)));
	}

	private async processItem(dto: UtilityMetersQueryResultDTO): Promise<void> {
		const context = LABEL_TO_CONTEXT[dto.label];

		if (!context) {
			this.#logger?.warn({ label: dto.label }, "Unknown label — discarded");
			return;
		}

		const { electricity, water, gas } = dto.utilityMeters;

		const readings = {
			...(electricity !== undefined
				? { electricity: { value: electricity.value } }
				: {}),
			...(water !== undefined ? { water: { value: water.value } } : {}),
			...(gas !== undefined ? { gas: { value: gas.value } } : {}),
		};

		await this.#evaluationService.checkRealtimeReadings({
			readings,
			context,
		});
	}
}
