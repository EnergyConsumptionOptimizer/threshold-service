import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThresholdRepositoryPort } from "src/domain/port/ThresholdRepositoryPort";
import { UtilityType } from "src/domain/value/UtilityType";
import { ThresholdType } from "src/domain/value/ThresholdType";
import { ThresholdValue } from "src/domain/value/ThresholdValue";
import { PeriodType } from "src/domain/value/PeriodType";
import { ThresholdId } from "src/domain/value/ThresholdId";
import { CreateThresholdUseCase } from "src/application/usecases/CreateThresholdUseCase";
import { Threshold } from "@domain/Threshold";

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
      findByStatus: vi.fn(),
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
      true,
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
      true,
      PeriodType.ONE_DAY,
    );

    mockSave.mockResolvedValue(savedThreshold);

    const result = await useCase.save(
      UtilityType.GAS,
      ThresholdType.FORECAST,
      ThresholdValue.of(150),
      true,
      PeriodType.ONE_DAY,
    );

    expect(result).toBe(savedThreshold);
  });
});
