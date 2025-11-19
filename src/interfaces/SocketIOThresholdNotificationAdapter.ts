import type { Socket } from "socket.io-client";
import type { ThresholdNotificationPort } from "@domain/port/ThresholdNotificationPort";
import type { Threshold } from "@domain/Threshold";
import { connectSocket } from "@interfaces/socket/SocketConnectionHelper";
import { mapToThresholdEvents } from "@presentation/mappers/thresholdEventDTO";

export class SocketIOThresholdNotificationAdapter
  implements ThresholdNotificationPort
{
  private socket: Socket | null = null;

  constructor(private readonly monitoringServiceUrl: string) {}

  async connect(): Promise<void> {
    this.socket = await connectSocket(this.monitoringServiceUrl);
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  async notifyThresholdsChange(thresholds: Threshold[]): Promise<void> {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }

    this.socket.emit("thresholds", {
      thresholds: mapToThresholdEvents(thresholds),
    });
  }
}
