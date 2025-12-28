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
import { ThresholdName } from "@domain/value/ThresholdName";

describe("ConsumptionEvaluationService", () => {
  let mockRepository: ThresholdRepositoryPort;
  let service: ConsumptionEvaluationService;

  const createThreshold = (
    id: string,
    name: string,
    value: number,
    state: ThresholdState,
  ): Threshold => {
    return Threshold.create(
      ThresholdId.of(id),
      ThresholdName.of(name),
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
    it("should evaluate ACTUAL consumption without periodType", async () => {
      const consumption: ConsumptionParams = {
        utilityType: UtilityType.ELECTRICITY,
        thresholdType: ThresholdType.ACTUAL,
        value: 150,
      };

      const threshold = createThreshold("1", "T1", 100, ThresholdState.ENABLED);
      vi.mocked(mockRepository.findByFilters).mockResolvedValue([threshold]);

      const result = await service.evaluateConsumption(consumption);

      expect(mockRepository.findByFilters).toHaveBeenCalledWith({
        utilityType: UtilityType.ELECTRICITY,
        thresholdType: ThresholdType.ACTUAL,
      });
      expect(result).toHaveLength(1);
      expect(result[0].thresholdState).toBe(ThresholdState.BREACHED);
    });

    it("should evaluate HISTORICAL consumption with periodType", async () => {
      const consumption: ConsumptionParams = {
        utilityType: UtilityType.WATER,
        thresholdType: ThresholdType.HISTORICAL,
        periodType: PeriodType.ONE_DAY,
        value: 200,
      };

      const threshold = createThreshold("2", "T2", 150, ThresholdState.ENABLED);
      vi.mocked(mockRepository.findByFilters).mockResolvedValue([threshold]);

      const result = await service.evaluateConsumption(consumption);

      expect(mockRepository.findByFilters).toHaveBeenCalledWith({
        utilityType: UtilityType.WATER,
        periodType: PeriodType.ONE_DAY,
        thresholdType: ThresholdType.HISTORICAL,
      });
      expect(result).toHaveLength(1);
      expect(result[0].thresholdState).toBe(ThresholdState.BREACHED);
    });

    it("should return an empty array if no thresholds are breached", async () => {
      const consumption: ConsumptionParams = {
        utilityType: UtilityType.GAS,
        thresholdType: ThresholdType.FORECAST,
        periodType: PeriodType.ONE_MONTH,
        value: 50,
      };

      const threshold = createThreshold("3", "T3", 150, ThresholdState.ENABLED);
      vi.mocked(mockRepository.findByFilters).mockResolvedValue([threshold]);

      const result = await service.evaluateConsumption(consumption);

      expect(result).toEqual([]);
    });
  });

  describe("evaluateBatch", () => {
    it("should evaluate multiple measurements", async () => {
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

      const threshold1 = createThreshold(
        "1",
        "T1",
        100,
        ThresholdState.ENABLED,
      );
      const threshold2 = createThreshold(
        "2",
        "T2",
        150,
        ThresholdState.ENABLED,
      );

      vi.mocked(mockRepository.findByFilters)
        .mockResolvedValueOnce([threshold1])
        .mockResolvedValueOnce([threshold2]);

      const result = await service.evaluateBatch(consumptions);

      expect(mockRepository.findByFilters).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });
});
