import type { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import type { ThresholdNotificationPort } from "@domain/port/ThresholdNotificationPort";
import type { Threshold } from "@domain/Threshold";
import { ThresholdState } from "@domain/value/ThresholdState";

export class ThresholdMonitoringService {
  private lastSnapshot: Threshold[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly repository: ThresholdRepositoryPort,
    private readonly notificationPort: ThresholdNotificationPort,
    private readonly pollIntervalMs = 10000,
  ) {}

  async start(): Promise<void> {
    if (this.intervalId) {
      return;
    }
    await this.notificationPort.connect();
    this.intervalId = setInterval(async () => {
      await this.checkAndNotifyChanges();
    }, this.pollIntervalMs);
  }

  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    await this.notificationPort.disconnect();
  }

  private async checkAndNotifyChanges(): Promise<void> {
    try {
      const currentThresholds = await this.repository.findByFilters(
        undefined,
        undefined,
        undefined,
        ThresholdState.ENABLED,
      );

      if (this.hasChanged(currentThresholds)) {
        await this.notificationPort.notifyThresholdsChange(currentThresholds);

        this.lastSnapshot = currentThresholds;
      }
    } catch (error) {
      console.error(error);
    }
  }

  private hasChanged(current: Threshold[]): boolean {
    if (current.length !== this.lastSnapshot.length) return true;
    const currentIds = new Set(current.map((t) => t.id.valueOf()));
    const lastIds = new Set(this.lastSnapshot.map((t) => t.id.valueOf()));
    return (
      current.some((t) => !lastIds.has(t.id.valueOf())) ||
      this.lastSnapshot.some((t) => !currentIds.has(t.id.valueOf()))
    );
  }
}
