import type { ThresholdBreachAlertPort } from "@domain/port/ThresholdBreachAlertPort";
import type { Threshold } from "@domain/Threshold";
import { toThresholdEventDTO } from "@presentation/mappers/thresholdEventDTO";

export class HttpAlertServiceAdapter implements ThresholdBreachAlertPort {
  constructor(
    private readonly alertServiceUrl: string,
    private readonly timeoutMs = 5000,
  ) {}

  async notifyBreach(threshold: Threshold, currentValue: number) {
    const payload = {
      ...toThresholdEventDTO(threshold),
      currentValue,
      breachedAt: new Date().toISOString(),
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.alertServiceUrl}/api/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        new Error(`Alert service status ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.warn(`Alert timeout for threshold ${threshold.id.value}`);
      } else {
        console.error(
          `Alert error for threshold ${threshold.id.value}:`,
          error,
        );
      }
    }
  }
}
