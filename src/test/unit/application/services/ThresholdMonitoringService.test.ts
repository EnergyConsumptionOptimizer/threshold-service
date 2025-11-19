import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ThresholdMonitoringService } from "@application/services/ThresholdMonitoringService";
import type { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import type { ThresholdNotificationPort } from "@domain/port/ThresholdNotificationPort";
import { Threshold } from "@domain/Threshold";
import { ThresholdId } from "@domain/value/ThresholdId";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdState } from "@domain/value/ThresholdState";

describe("ThresholdMonitoringService", () => {
  let mockRepository: ThresholdRepositoryPort;
  let mockNotificationPort: ThresholdNotificationPort;
  let service: ThresholdMonitoringService;

  const createMockThreshold = (
    id: string,
    utilityType: UtilityType,
  ): Threshold => {
    return Threshold.create(
      ThresholdId.of(id),
      utilityType,
      ThresholdValue.of(100),
      ThresholdType.ACTUAL,
      ThresholdState.ENABLED,
    );
  };

  beforeEach(() => {
    mockRepository = {
      findByFilters: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
    } as unknown as ThresholdRepositoryPort;

    mockNotificationPort = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      notifyThresholdsChange: vi.fn().mockResolvedValue(undefined),
    };

    service = new ThresholdMonitoringService(
      mockRepository,
      mockNotificationPort,
      100,
    );
  });

  afterEach(async () => {
    await service.stop();
  });

  describe("start", () => {
    it("should connect to notification port", async () => {
      await service.start();

      expect(mockNotificationPort.connect).toHaveBeenCalledOnce();
    });

    it("should not restart polling if already running", async () => {
      await service.start();
      await service.start();

      expect(mockNotificationPort.connect).toHaveBeenCalledOnce();
    });
  });

  describe("stop", () => {
    it("should disconnect from notification port", async () => {
      await service.start();
      await service.stop();

      expect(mockNotificationPort.disconnect).toHaveBeenCalledOnce();
    });
  });

  describe("polling and notifications", () => {
    it("should notify when detecting active thresholds for the first time", async () => {
      const thresholds = [
        createMockThreshold("1", UtilityType.ELECTRICITY),
        createMockThreshold("2", UtilityType.WATER),
      ];

      vi.mocked(mockRepository.findByFilters).mockResolvedValue(thresholds);

      await service.start();
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockRepository.findByFilters).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        ThresholdState.ENABLED,
      );
      expect(mockNotificationPort.notifyThresholdsChange).toHaveBeenCalledWith(
        thresholds,
      );
    });

    it("should not notify if thresholds have not changed", async () => {
      const thresholds = [createMockThreshold("1", UtilityType.ELECTRICITY)];

      vi.mocked(mockRepository.findByFilters).mockResolvedValue(thresholds);

      await service.start();
      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(mockNotificationPort.notifyThresholdsChange).toHaveBeenCalledTimes(
        1,
      );
    });

    it("should notify when thresholds change", async () => {
      const thresholds1 = [createMockThreshold("1", UtilityType.ELECTRICITY)];
      const thresholds2 = [
        createMockThreshold("1", UtilityType.ELECTRICITY),
        createMockThreshold("2", UtilityType.WATER),
      ];

      vi.mocked(mockRepository.findByFilters)
        .mockResolvedValueOnce(thresholds1)
        .mockResolvedValueOnce(thresholds2);

      await service.start();
      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(mockNotificationPort.notifyThresholdsChange).toHaveBeenCalledTimes(
        2,
      );
      expect(
        mockNotificationPort.notifyThresholdsChange,
      ).toHaveBeenNthCalledWith(1, thresholds1);
      expect(
        mockNotificationPort.notifyThresholdsChange,
      ).toHaveBeenNthCalledWith(2, thresholds2);
    });

    it("should handle polling errors without stopping the service", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      vi.mocked(mockRepository.findByFilters)
        .mockRejectedValueOnce(new Error("Database error"))
        .mockResolvedValueOnce([
          createMockThreshold("1", UtilityType.ELECTRICITY),
        ]);

      await service.start();
      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNotificationPort.notifyThresholdsChange).toHaveBeenCalledTimes(
        1,
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
