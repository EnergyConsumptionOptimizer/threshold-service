import {
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from "vitest";
import { UpdateThresholdUseCase } from "@application/usecases/UpdateThresholdUseCase";
import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { ThresholdId } from "@domain/value/ThresholdId";
import { Threshold } from "@domain/Threshold";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { ThresholdType } from "@domain/value/ThresholdType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdState } from "@domain/value/ThresholdState";

describe("UpdateThresholdUseCase", () => {
  let useCase: UpdateThresholdUseCase;
  let repository: ThresholdRepositoryPort;
  let updateMock: MockInstance<
    (id: ThresholdId, attrs: Partial<Threshold>) => Promise<Threshold | null>
  >;

  const mockThreshold = Threshold.create(
    ThresholdId.of("1"),
    UtilityType.GAS,
    ThresholdValue.of(10),
    ThresholdType.FORECAST,
    ThresholdState.ENABLED,
    PeriodType.ONE_DAY,
  );

  beforeEach(() => {
    updateMock = vi.fn();
    repository = {
      update: updateMock,
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findByFilters: vi.fn(),
      delete: vi.fn(),
    } as unknown as ThresholdRepositoryPort;

    useCase = new UpdateThresholdUseCase(repository);
  });

  it("should update a threshold and return it", async () => {
    const id = ThresholdId.of("1");
    const attrs: Partial<Threshold> = { value: ThresholdValue.of(20) };

    updateMock.mockResolvedValue(
      Threshold.create(
        mockThreshold.id,
        mockThreshold.utilityType,
        attrs.value ?? mockThreshold.value,
        mockThreshold.thresholdType,
        mockThreshold.thresholdState,
        mockThreshold.periodType,
      ),
    );

    const result = await useCase.update(id, attrs);

    expect(updateMock).toHaveBeenCalledOnce();
    expect(updateMock).toHaveBeenCalledWith(id, attrs);
    expect(result?.value).toEqual(ThresholdValue.of(20));
  });

  it("should return null if threshold does not exist", async () => {
    const id = ThresholdId.of("2");
    const attrs: Partial<Threshold> = { value: ThresholdValue.of(20) };

    updateMock.mockResolvedValue(null);

    const result = await useCase.update(id, attrs);

    expect(updateMock).toHaveBeenCalledOnce();
    expect(updateMock).toHaveBeenCalledWith(id, attrs);
    expect(result).toBeNull();
  });
});
