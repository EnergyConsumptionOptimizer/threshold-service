import type { Socket } from "socket.io-client";
import type { ConsumptionEvaluationService } from "@application/services/ConsumptionEvaluationService";
import {
  mapConsumptionDataToDomain,
  parseConsumptionData,
} from "@presentation/mappers/consumptionDataDTO";
import { connectSocket } from "@interfaces/socket/SocketConnectionHelper";

/**
 * Subscribe to consumption events from the monitoring service and evaluate them.
 */
export class ConsumptionEventListener {
  private socket: Socket | null = null;

  constructor(
    private readonly monitoringServiceUrl: string,
    private readonly consumptionEvaluationService: ConsumptionEvaluationService,
  ) {}

  /**
   * Establish the socket connection and register event handlers.
   *
   * @returns A promise that resolves once connected.
   */
  async connect(): Promise<void> {
    this.socket = await connectSocket(this.monitoringServiceUrl);
    this.registerEventHandlers();
  }

  /**
   * Disconnect and clear listeners.
   *
   * @returns A promise that resolves once disconnected.
   */
  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private registerEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on("consumption", (data: unknown) => {
      this.handleConsumption(data);
    });

    this.socket.on("consumption-batch", (data: unknown) => {
      this.handleConsumptionBatch(data);
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log(`Consumption listener disconnected: ${reason}`);
    });

    this.socket.on("error", (error: Error) => {
      console.error("Consumption listener socket error:", error);
    });
  }

  private async handleConsumption(data: unknown): Promise<void> {
    const parsed = parseConsumptionData(data);

    if (!parsed.success) {
      console.warn("Invalid consumption data received");
      return;
    }

    try {
      const params = mapConsumptionDataToDomain(parsed.data);
      await this.consumptionEvaluationService.evaluateConsumption(params);
    } catch (error) {
      console.error("Failed to evaluate consumption:", error);
    }
  }

  private async handleConsumptionBatch(data: unknown): Promise<void> {
    if (!this.isValidBatchData(data)) {
      console.warn("Invalid batch data received");
      return;
    }

    const validConsumptions = data.consumptions
      .map(parseConsumptionData)
      .filter((result) => result.success)
      .map((result) => mapConsumptionDataToDomain(result.data));

    if (validConsumptions.length === 0) return;

    try {
      await this.consumptionEvaluationService.evaluateBatch(validConsumptions);
    } catch (error) {
      console.error("Failed to evaluate consumption batch:", error);
    }
  }

  private isValidBatchData(data: unknown): data is { consumptions: unknown[] } {
    return (
      data !== null &&
      typeof data === "object" &&
      "consumptions" in data &&
      Array.isArray(data.consumptions)
    );
  }
}
