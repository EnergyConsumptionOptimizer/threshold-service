import axios from "axios";
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
    const dto = toThresholdEventDTO(threshold);
    const { value, ...rest } = dto;

    const payload = {
      ...rest,
      limitValue: value,
      detectedValue: currentValue,
    };

    try {
      await axios.post(`${this.alertServiceUrl}/api/internal/alerts`, payload, {
        timeout: this.timeoutMs,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          console.warn(`Alert timeout for threshold ${threshold.id.value}`);
        } else {
          console.error(
            `Alert service error [${error.response?.status}]:`,
            error.message,
          );
        }
      } else {
        console.error(
          `Unexpected error notifying breach for ${threshold.id.value}:`,
          error,
        );
      }
    }
  }
}
