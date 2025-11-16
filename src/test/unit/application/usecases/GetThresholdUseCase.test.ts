import { beforeEach, describe, expect, it, vi } from "vitest";
import { GetThresholdUseCase } from "@application/usecases/GetThresholdUseCase";
import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { Threshold } from "@domain/Threshold";
import { ThresholdId } from "@domain/value/ThresholdId";
import { UtilityType } from "@domain/value/UtilityType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { ThresholdState } from "@domain/value/ThresholdState";

describe("GetThresholdUseCase", () => {
  let useCase: GetThresholdUseCase;
  let repository: Partial<ThresholdRepositoryPort>;

  const mockThreshold: Threshold = {
    id: ThresholdId.of("1"),
    utilityType: UtilityType.GAS,
    periodType: PeriodType.ONE_DAY,
    thresholdType: ThresholdType.FORECAST,
    value: ThresholdValue.of(10),
    thresholdState: ThresholdState.ENABLED,
  } as Threshold;

  beforeEach(() => {
    repository = {
      findById: vi.fn(),
      findByFilters: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new GetThresholdUseCase(repository as ThresholdRepositoryPort);
  });

  it("should return a threshold when findById finds it", async () => {
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockThreshold,
    );

    const result = await useCase.findById(ThresholdId.of("1"));

    expect(repository.findById).toHaveBeenCalledOnce();
    expect(repository.findById).toHaveBeenCalledWith(ThresholdId.of("1"));
    expect(result).toEqual(mockThreshold);
  });

  it("should return null when findById does not find the threshold", async () => {
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await useCase.findById(ThresholdId.of("999"));

    expect(repository.findById).toHaveBeenCalledOnce();
    expect(repository.findById).toHaveBeenCalledWith(ThresholdId.of("999"));
    expect(result).toBeNull();
  });

  it("should return thresholds array when findByFilters finds results", async () => {
    (repository.findByFilters as ReturnType<typeof vi.fn>).mockResolvedValue([
      mockThreshold,
    ]);

    const result = await useCase.findByFilters(
      UtilityType.GAS,
      PeriodType.ONE_DAY,
      ThresholdType.FORECAST,
      ThresholdState.ENABLED,
    );

    expect(repository.findByFilters).toHaveBeenCalledOnce();
    expect(repository.findByFilters).toHaveBeenCalledWith(
      UtilityType.GAS,
      PeriodType.ONE_DAY,
      ThresholdType.FORECAST,
      ThresholdState.ENABLED,
    );
    expect(result).toEqual([mockThreshold]);
  });

  it("should return empty array when findByFilters finds no results", async () => {
    (repository.findByFilters as ReturnType<typeof vi.fn>).mockResolvedValue(
      [],
    );

    const result = await useCase.findByFilters(
      UtilityType.GAS,
      PeriodType.ONE_DAY,
      ThresholdType.FORECAST,
      ThresholdState.ENABLED,
    );

    expect(repository.findByFilters).toHaveBeenCalledOnce();
    expect(result).toEqual([]);
  });

  it("should return all thresholds", async () => {
    (repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([
      mockThreshold,
    ]);

    const result = await useCase.findAll();

    expect(repository.findAll).toHaveBeenCalledOnce();
    expect(result).toEqual([mockThreshold]);
  });

  it("should return empty array if no thresholds exist", async () => {
    (repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await useCase.findAll();

    expect(repository.findAll).toHaveBeenCalledOnce();
    expect(result).toEqual([]);
  });
});
