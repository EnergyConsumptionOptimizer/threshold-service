import type { Socket } from "socket.io-client";
import type { ThresholdNotificationPort } from "@domain/port/ThresholdNotificationPort";
import type { Threshold } from "@domain/Threshold";
import { connectSocket } from "@interfaces/socket/SocketConnectionHelper";
import { mapToThresholdEvents } from "@presentation/mappers/thresholdEventDTO";

/**
 * Publish threshold updates to the monitoring service via Socket.IO.
 */
export class SocketIOThresholdNotificationAdapter implements ThresholdNotificationPort {
  private socket: Socket | null = null;

  constructor(private readonly monitoringServiceUrl: string) {}

  /**
   * Establish the socket connection.
   *
   * @returns A promise that resolves once connected.
   */
  async connect(): Promise<void> {
    this.socket = await connectSocket(this.monitoringServiceUrl);
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

  /**
   * Emit the latest thresholds list.
   *
   * @param thresholds The thresholds to publish.
   */
  async notifyThresholdsChange(thresholds: Threshold[]): Promise<void> {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }

    this.socket.emit("thresholds", {
      thresholds: mapToThresholdEvents(thresholds),
    });
  }
}
