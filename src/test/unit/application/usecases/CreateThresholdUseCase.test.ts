import { beforeEach, describe, expect, it, vi } from "vitest";
import { Threshold } from "@domain/Threshold";
import { CreateThresholdUseCase } from "@application/usecases/CreateThresholdUseCase";
import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { ThresholdId } from "@domain/value/ThresholdId";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdState } from "@domain/value/ThresholdState";

describe("CreateThresholdUseCase", () => {
  let useCase: CreateThresholdUseCase;
  let mockSave: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSave = vi
      .fn()
      .mockImplementation((threshold) => Promise.resolve(threshold));
    const repository = {
      save: mockSave,
      findById: vi.fn(),
      findAll: vi.fn(),
      findByFilters: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as ThresholdRepositoryPort;
    useCase = new CreateThresholdUseCase(repository);
  });

  it("should create threshold with placeholder id and save it", async () => {
    const result = await useCase.save(
      UtilityType.ELECTRICITY,
      ThresholdType.ACTUAL,
      ThresholdValue.of(100),
      ThresholdState.ENABLED,
    );

    expect(mockSave).toHaveBeenCalledOnce();
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: ThresholdId.of("id-placeholder"),
      }),
    );
    expect(result.id).toEqual(ThresholdId.of("id-placeholder"));
  });

  it("should return saved threshold from repository", async () => {
    const savedThreshold = Threshold.create(
      ThresholdId.of("mock-id"),
      UtilityType.GAS,
      ThresholdValue.of(150),
      ThresholdType.FORECAST,
      ThresholdState.ENABLED,
      PeriodType.ONE_DAY,
    );

    mockSave.mockResolvedValue(savedThreshold);

    const result = await useCase.save(
      UtilityType.GAS,
      ThresholdType.FORECAST,
      ThresholdValue.of(150),
      ThresholdState.ENABLED,
      PeriodType.ONE_DAY,
    );

    expect(result).toBe(savedThreshold);
  });
});
