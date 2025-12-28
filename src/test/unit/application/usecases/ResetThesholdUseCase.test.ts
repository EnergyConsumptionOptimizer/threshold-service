import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResetThresholdUseCase } from "@application/usecases/ResetThresholdUseCase";
import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { Threshold } from "@domain/Threshold";
import { ThresholdId } from "@domain/value/ThresholdId";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { ThresholdType } from "@domain/value/ThresholdType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdState } from "@domain/value/ThresholdState";
import { ThresholdName } from "@domain/value/ThresholdName";

describe("ResetThresholdUseCase", () => {
  let useCase: ResetThresholdUseCase;
  let repository: ThresholdRepositoryPort;

  beforeEach(() => {
    repository = {
      findAll: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findByFilters: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new ResetThresholdUseCase(repository);
  });

  const makeThreshold = (
    id: string,
    name: string,
    state: ThresholdState,
    period: PeriodType,
  ) =>
    Threshold.create(
      ThresholdId.of(id),
      ThresholdName.of(name),
      UtilityType.GAS,
      ThresholdValue.of(10),
      ThresholdType.HISTORICAL,
      state,
      period,
    );

  it("should reset breached daily thresholds", async () => {
    const t = makeThreshold(
      "t1",
      "T1",
      ThresholdState.BREACHED,
      PeriodType.ONE_DAY,
    );

    (repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([t]);

    const result = await useCase.reset();

    expect(result).toHaveLength(1);
    expect(result[0].thresholdState).toBe(ThresholdState.ENABLED);
    expect(repository.update).toHaveBeenCalledWith(
      t.id,
      expect.objectContaining({
        thresholdState: ThresholdState.ENABLED,
      }),
    );
  });

  it("should reset weekly thresholds only on Monday", async () => {
    vi.setSystemTime(new Date("2024-04-01T10:00:00")); // Monday
    const t = makeThreshold(
      "w1",
      "Tw1",
      ThresholdState.BREACHED,
      PeriodType.ONE_WEEK,
    );

    (repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([t]);

    const result = await useCase.reset();

    expect(result).toHaveLength(1);
  });

  it("should NOT reset weekly thresholds on other days", async () => {
    vi.setSystemTime(new Date("2024-04-02T10:00:00")); // Tuesday
    const t = makeThreshold(
      "w2",
      "Tw2",
      ThresholdState.BREACHED,
      PeriodType.ONE_WEEK,
    );

    (repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([t]);

    const result = await useCase.reset();

    expect(result).toHaveLength(0);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("should reset monthly thresholds only on the first day", async () => {
    vi.setSystemTime(new Date("2024-05-01T10:00:00"));
    const t = makeThreshold(
      "m1",
      "Tm1",
      ThresholdState.BREACHED,
      PeriodType.ONE_MONTH,
    );

    (repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([t]);

    const result = await useCase.reset();

    expect(result).toHaveLength(1);
  });

  it("should ignore thresholds not in BREACHED state", async () => {
    const t = makeThreshold(
      "1",
      "T1",
      ThresholdState.ENABLED,
      PeriodType.ONE_DAY,
    );

    (repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([t]);

    const result = await useCase.reset();

    expect(result).toHaveLength(0);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
