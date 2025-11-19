import cron, { ScheduledTask } from "node-cron";
import { ResetThresholdUseCase } from "@application/usecases/ResetThresholdUseCase";

export class ThresholdResetScheduler {
  private task: ScheduledTask | null = null;
  private readonly cronExpression = "0 0 * * *";

  constructor(private readonly resetUseCase: ResetThresholdUseCase) {}

  start() {
    if (!cron.validate(this.cronExpression)) {
      throw new Error(`Invalid cron expression: ${this.cronExpression}`);
    }

    this.task = cron.schedule(this.cronExpression, async () => {
      try {
        await this.resetUseCase.reset();
      } catch (error) {
        console.error("Scheduler reset error:", error);
      }
    });

    console.log("Scheduler reset started.");
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log("Scheduler reset stopped.");
    }
  }
}
