import type { Socket } from "socket.io-client";
import type {
  ConsumptionEvaluationService,
  EvaluationContext,
} from "@application/services/ConsumptionEvaluationService";
import { createSocket } from "@interfaces/socket/socketFactory";
import { ThresholdType } from "@domain/value/ThresholdType";
import { PeriodType } from "@domain/value/PeriodType";
import {
  UtilityMetersQueryDTO,
  UtilityMetersQueryResultDTO,
  utilityMetersUpdateSchema,
} from "@interfaces/socket/monitoringSchemas";

export class ConsumptionSubscriber {
  private socket: Socket | null = null;
  private readonly NAMESPACE = "/utility-meters";

  private readonly SUBSCRIPTIONS: UtilityMetersQueryDTO[] = [
    { label: "realtime" },
    { label: "day", filter: { from: "1day" } },
    { label: "week", filter: { from: "1week" } },
    { label: "month", filter: { from: "1month" } },
  ];

  constructor(
    private readonly monitoringServiceUrl: string,
    private readonly service: ConsumptionEvaluationService,
  ) {}

  async connect(): Promise<void> {
    const url = new URL(this.NAMESPACE, this.monitoringServiceUrl).toString();
    this.socket = await createSocket(url);
    this.setupEvents();
  }

  async disconnect(): Promise<void> {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
  }

  private setupEvents(): void {
    if (!this.socket) return;

    const subscribe = () => {
      console.log(`[Subscriber] Subscribing to ${this.NAMESPACE}...`);
      this.socket?.emit("subscribe", this.SUBSCRIPTIONS);
    };

    this.socket.on("connect", subscribe);
    if (this.socket.connected) subscribe();

    this.socket.on("disconnect", (reason) =>
      console.warn(`[Subscriber] Disconnected: ${reason}`),
    );

    this.socket.on("utilityMetersUpdate", (data) => {
      const parsed = utilityMetersUpdateSchema.safeParse(data);
      if (parsed.success) {
        parsed.data.forEach((item) => this.handleIncomingData(item));
      } else {
        console.warn("[Subscriber] Invalid batch update", parsed.error);
      }
    });
  }

  private async handleIncomingData(
    dto: UtilityMetersQueryResultDTO,
  ): Promise<void> {
    const context = this.resolveContext(dto.label);
    if (context) {
      await this.service.processReadings(dto.utilityMeters, context);
    }
  }

  private resolveContext(label: string): EvaluationContext | null {
    switch (label) {
      case "realtime":
        return { thresholdType: ThresholdType.ACTUAL };
      case "day":
        return {
          thresholdType: ThresholdType.HISTORICAL,
          periodType: PeriodType.ONE_DAY,
        };
      case "week":
        return {
          thresholdType: ThresholdType.HISTORICAL,
          periodType: PeriodType.ONE_WEEK,
        };
      case "month":
        return {
          thresholdType: ThresholdType.HISTORICAL,
          periodType: PeriodType.ONE_MONTH,
        };
      default:
        return null;
    }
  }
}
