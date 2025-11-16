import { beforeEach, describe, expect, it, vi } from "vitest";
import { EvaluateThresholdUseCase } from "@application/usecases/EvaluateThresholdUseCase";
import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { Threshold } from "@domain/Threshold";
import { ThresholdId } from "@domain/value/ThresholdId";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { ThresholdType } from "@domain/value/ThresholdType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdState } from "@domain/value/ThresholdState";

describe("EvaluateThresholdUseCase", () => {
  let useCase: EvaluateThresholdUseCase;
  let repository: Partial<ThresholdRepositoryPort>;

  beforeEach(() => {
    repository = {
      findById: vi.fn(),
      findByFilters: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new EvaluateThresholdUseCase(
      repository as ThresholdRepositoryPort,
    );
  });

  const makeThreshold = (id: string, state: ThresholdState, limit: number) =>
    Threshold.create(
      ThresholdId.of(id),
      UtilityType.GAS,
      ThresholdValue.of(limit),
      ThresholdType.HISTORICAL,
      state,
      PeriodType.ONE_DAY,
    );

  it("should breach enabled thresholds and update them", async () => {
    const t1 = makeThreshold("t1", ThresholdState.ENABLED, 50);
    const t2 = makeThreshold("t2", ThresholdState.ENABLED, 200);
    const t3 = makeThreshold("t3", ThresholdState.DISABLED, 10);

    (repository.findByFilters as ReturnType<typeof vi.fn>).mockResolvedValue([
      t1,
      t2,
      t3,
    ]);

    const result = await useCase.evaluate(
      UtilityType.GAS,
      ThresholdType.HISTORICAL,
      100,
      PeriodType.ONE_DAY,
    );

    expect(result).toHaveLength(1);
    expect(result[0].thresholdState).toBe(ThresholdState.BREACHED);
    expect(repository.update).toHaveBeenCalledWith(
      t1.id,
      expect.objectContaining({ thresholdState: ThresholdState.BREACHED }),
    );
  });

  it("should return empty array when no threshold is breached", async () => {
    const t1 = makeThreshold("t1", ThresholdState.ENABLED, 500);
    const t2 = makeThreshold("t2", ThresholdState.ENABLED, 400);

    (repository.findByFilters as ReturnType<typeof vi.fn>).mockResolvedValue([
      t1,
      t2,
    ]);

    const result = await useCase.evaluate(
      UtilityType.GAS,
      ThresholdType.HISTORICAL,
      100,
      PeriodType.ONE_DAY,
    );

    expect(result).toHaveLength(0);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("should ignore thresholds not in ENABLED state", async () => {
    const t1 = makeThreshold("d1", ThresholdState.DISABLED, 10);
    const t2 = makeThreshold("b1", ThresholdState.BREACHED, 10);

    (repository.findByFilters as ReturnType<typeof vi.fn>).mockResolvedValue([
      t1,
      t2,
    ]);

    const result = await useCase.evaluate(
      UtilityType.GAS,
      ThresholdType.HISTORICAL,
      100,
      PeriodType.ONE_DAY,
    );

    expect(result).toHaveLength(0);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
