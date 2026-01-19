import type { Socket } from "socket.io-client";
import type { ThresholdNotificationPort } from "@domain/port/ThresholdNotificationPort";
import type { Threshold } from "@domain/Threshold";
import { createSocket } from "@interfaces/socket/socketFactory";
import { mapToThresholdEvents } from "@presentation/mappers/thresholdEventDTO";

export class ThresholdSocketPublisher implements ThresholdNotificationPort {
  private socket: Socket | null = null;
  private readonly NAMESPACE = "/utility-meters";

  constructor(private readonly monitoringServiceUrl: string) {}

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

  async notifyThresholdsChange(thresholds: Threshold[]): Promise<void> {
    await this.publishChanges(thresholds);
  }

  private async publishChanges(thresholds: Threshold[]): Promise<void> {
    if (!this.socket?.connected) return;

    this.socket.emit("thresholds", {
      thresholds: mapToThresholdEvents(thresholds),
    });
  }

  private setupEvents(): void {
    if (!this.socket) return;
    const onReady = () => console.log("[Publisher] Ready to emit thresholds.");

    this.socket.on("connect", onReady);
    this.socket.on("disconnect", (r) =>
      console.warn(`[Publisher] Disconnected: ${r}`),
    );

    if (this.socket.connected) onReady();
  }
}
