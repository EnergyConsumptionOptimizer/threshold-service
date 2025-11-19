import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ConsumptionEvaluationService,
  ConsumptionParams,
} from "@application/services/ConsumptionEvaluationService";
import type { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { Threshold } from "@domain/Threshold";
import { ThresholdId } from "@domain/value/ThresholdId";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdState } from "@domain/value/ThresholdState";
import { PeriodType } from "@domain/value/PeriodType";

describe("ConsumptionEvaluationService", () => {
  let mockRepository: ThresholdRepositoryPort;
  let service: ConsumptionEvaluationService;

  const createThreshold = (
    id: string,
    value: number,
    state: ThresholdState,
  ): Threshold => {
    return Threshold.create(
      ThresholdId.of(id),
      UtilityType.ELECTRICITY,
      ThresholdValue.of(value),
      ThresholdType.ACTUAL,
      state,
    );
  };

  beforeEach(() => {
    mockRepository = {
      findByFilters: vi.fn(),
      update: vi.fn(),
    } as unknown as ThresholdRepositoryPort;

    service = new ConsumptionEvaluationService(mockRepository);
  });

  describe("evaluateConsumption", () => {
    it("dovrebbe valutare un consumo ACTUAL senza periodType", async () => {
      const consumption: ConsumptionParams = {
        utilityType: UtilityType.ELECTRICITY,
        thresholdType: ThresholdType.ACTUAL,
        value: 150,
      };

      const threshold = createThreshold("1", 100, ThresholdState.ENABLED);
      vi.mocked(mockRepository.findByFilters).mockResolvedValue([threshold]);

      const result = await service.evaluateConsumption(consumption);

      expect(mockRepository.findByFilters).toHaveBeenCalledWith(
        UtilityType.ELECTRICITY,
        undefined,
        ThresholdType.ACTUAL,
      );
      expect(result).toHaveLength(1);
      expect(result[0].thresholdState).toBe(ThresholdState.BREACHED);
    });

    it("dovrebbe valutare un consumo HISTORICAL con periodType", async () => {
      const consumption: ConsumptionParams = {
        utilityType: UtilityType.WATER,
        thresholdType: ThresholdType.HISTORICAL,
        periodType: PeriodType.ONE_DAY,
        value: 200,
      };

      const threshold = createThreshold("2", 150, ThresholdState.ENABLED);
      vi.mocked(mockRepository.findByFilters).mockResolvedValue([threshold]);

      const result = await service.evaluateConsumption(consumption);

      expect(mockRepository.findByFilters).toHaveBeenCalledWith(
        UtilityType.WATER,
        PeriodType.ONE_DAY,
        ThresholdType.HISTORICAL,
      );
      expect(result).toHaveLength(1);
      expect(result[0].thresholdState).toBe(ThresholdState.BREACHED);
    });

    it("dovrebbe ritornare array vuoto se nessuna soglia è breached", async () => {
      const consumption: ConsumptionParams = {
        utilityType: UtilityType.GAS,
        thresholdType: ThresholdType.FORECAST,
        periodType: PeriodType.ONE_MONTH,
        value: 50,
      };

      const threshold = createThreshold("3", 150, ThresholdState.ENABLED);
      vi.mocked(mockRepository.findByFilters).mockResolvedValue([threshold]);

      const result = await service.evaluateConsumption(consumption);

      expect(result).toEqual([]);
    });

    it("dovrebbe gestire errori e propagarli", async () => {
      const consumption: ConsumptionParams = {
        utilityType: UtilityType.ELECTRICITY,
        thresholdType: ThresholdType.ACTUAL,
        value: 150,
      };

      const error = new Error("Database error");
      vi.mocked(mockRepository.findByFilters).mockRejectedValue(error);

      await expect(service.evaluateConsumption(consumption)).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("evaluateBatch", () => {
    it("dovrebbe valutare multiple misurazioni", async () => {
      const consumptions: ConsumptionParams[] = [
        {
          utilityType: UtilityType.ELECTRICITY,
          thresholdType: ThresholdType.ACTUAL,
          value: 150,
        },
        {
          utilityType: UtilityType.WATER,
          thresholdType: ThresholdType.HISTORICAL,
          periodType: PeriodType.ONE_DAY,
          value: 200,
        },
      ];

      const threshold1 = createThreshold("1", 100, ThresholdState.ENABLED);
      const threshold2 = createThreshold("2", 150, ThresholdState.ENABLED);

      vi.mocked(mockRepository.findByFilters)
        .mockResolvedValueOnce([threshold1])
        .mockResolvedValueOnce([threshold2]);

      const result = await service.evaluateBatch(consumptions);

      expect(mockRepository.findByFilters).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it("dovrebbe ritornare array vuoto per batch vuoto", async () => {
      const result = await service.evaluateBatch([]);

      expect(mockRepository.findByFilters).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
