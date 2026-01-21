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
    type: ThresholdType = ThresholdType.ACTUAL,
    period?: PeriodType,
  ): Threshold => {
    return Threshold.create(
      ThresholdId.of(id),
      ThresholdName.of(name),
      UtilityType.ELECTRICITY,
      ThresholdValue.of(value),
      type,
      state,
      period,
    );
  };

  beforeEach(() => {
    mockRepository = {
      findByFilters: vi.fn(),
      update: vi.fn(),
    } as unknown as ThresholdRepositoryPort;

    service = new ConsumptionEvaluationService(mockRepository);
  });

  describe("evaluate", () => {
    it("should evaluate ACTUAL consumption, detect breach, but NOT update state", async () => {
      const consumption: ConsumptionParams = {
        utilityType: UtilityType.ELECTRICITY,
        thresholdType: ThresholdType.ACTUAL,
        value: 150,
      };

      const threshold = createThreshold(
        "1",
        "T1",
        100,
        ThresholdState.ENABLED,
        ThresholdType.ACTUAL,
      );
      vi.mocked(mockRepository.findByFilters).mockResolvedValue([threshold]);

      const result = await service.evaluate(consumption);

      expect(mockRepository.findByFilters).toHaveBeenCalledWith({
        utilityType: UtilityType.ELECTRICITY,
        thresholdType: ThresholdType.ACTUAL,
      });
      expect(result).toHaveLength(1);
      // ACTUAL thresholds remain ENABLED even when breached
      expect(result[0].thresholdState).toBe(ThresholdState.ENABLED);
      // Repository update should NOT be called for ACTUAL
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it("should evaluate HISTORICAL consumption, detect breach, AND update state", async () => {
      const consumption: ConsumptionParams = {
        utilityType: UtilityType.WATER,
        thresholdType: ThresholdType.HISTORICAL,
        periodType: PeriodType.ONE_DAY,
        value: 200,
      };

      const threshold = createThreshold(
        "2",
        "T2",
        150,
        ThresholdState.ENABLED,
        ThresholdType.HISTORICAL,
        PeriodType.ONE_DAY,
      );
      vi.mocked(mockRepository.findByFilters).mockResolvedValue([threshold]);

      const result = await service.evaluate(consumption);

      expect(mockRepository.findByFilters).toHaveBeenCalledWith({
        utilityType: UtilityType.WATER,
        periodType: PeriodType.ONE_DAY,
        thresholdType: ThresholdType.HISTORICAL,
      });
      expect(result).toHaveLength(1);
      // HISTORICAL thresholds transition to BREACHED
      expect(result[0].thresholdState).toBe(ThresholdState.BREACHED);
      // Repository update MUST be called for HISTORICAL
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it("should return an empty array if no thresholds are breached", async () => {
      const consumption: ConsumptionParams = {
        utilityType: UtilityType.GAS,
        thresholdType: ThresholdType.FORECAST,
        periodType: PeriodType.ONE_MONTH,
        value: 50,
      };

      const threshold = createThreshold(
        "3",
        "T3",
        150,
        ThresholdState.ENABLED,
        ThresholdType.FORECAST,
        PeriodType.ONE_MONTH,
      );
      vi.mocked(mockRepository.findByFilters).mockResolvedValue([threshold]);

      const result = await service.evaluate(consumption);

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
        ThresholdType.ACTUAL,
      );
      const threshold2 = createThreshold(
        "2",
        "T2",
        150,
        ThresholdState.ENABLED,
        ThresholdType.HISTORICAL,
        PeriodType.ONE_DAY,
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
