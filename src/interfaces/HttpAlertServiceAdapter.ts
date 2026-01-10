import type { ThresholdBreachAlertPort } from "@domain/port/ThresholdBreachAlertPort";
import type { Threshold } from "@domain/Threshold";
import { toThresholdEventDTO } from "@presentation/mappers/thresholdEventDTO";

/**
 * Send breach notifications to an external alert service over HTTP.
 */
export class HttpAlertServiceAdapter implements ThresholdBreachAlertPort {
  constructor(
    private readonly alertServiceUrl: string,
    private readonly timeoutMs = 5000,
  ) {}

  /**
   * Notify the alert service about a threshold breach.
   *
   * @param threshold Breached threshold.
   * @param currentValue Consumption value that triggered the breach.
   */
  async notifyBreach(threshold: Threshold, currentValue: number) {
    const payload = {
      ...toThresholdEventDTO(threshold),
      detectedValue: currentValue,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(
        `${this.alertServiceUrl}/api/internal/alerts/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Alert service status ${response.status}`);
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
