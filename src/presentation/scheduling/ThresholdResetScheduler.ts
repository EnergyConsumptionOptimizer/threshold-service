import type { ThresholdService } from "@application/ports/in/ThresholdService";
import cron, { type ScheduledTask } from "node-cron";
import type { Logger } from "pino";

export class ThresholdResetScheduler {
	#task: ScheduledTask | null = null;
	readonly #cronExpression = "0 0 * * *";
	readonly #logger?: Logger;
	readonly #thresholdService: ThresholdService;

	constructor(thresholdService: ThresholdService, logger?: Logger) {
		this.#thresholdService = thresholdService;
		this.#logger = logger;
	}

	start(): void {
		if (!cron.validate(this.#cronExpression)) {
			throw new Error(`Invalid cron expression: ${this.#cronExpression}`);
		}

		this.#task = cron.schedule(this.#cronExpression, async () => {
			try {
				await this.#thresholdService.reset();
				this.#logger?.info("Scheduled threshold reset completed");
			} catch (error) {
				this.#logger?.error({ error }, "Scheduled threshold reset failed");
			}
		});

		this.#logger?.info("Threshold reset scheduler started");
	}

	stop(): void {
		if (this.#task) {
			this.#task.stop();
			this.#task = null;
			this.#logger?.info("Threshold reset scheduler stopped");
		}
	}
}
