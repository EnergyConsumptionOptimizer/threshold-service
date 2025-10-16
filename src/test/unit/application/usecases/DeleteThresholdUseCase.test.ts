import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThresholdRepositoryPort } from "src/domain/port/ThresholdRepositoryPort";
import { ThresholdId } from "src/domain/value/ThresholdId";
import { DeleteThresholdUseCase } from "src/application/usecases/DeleteThresholdUseCase";

describe("DeleteThresholdUseCase", () => {
  let useCase: DeleteThresholdUseCase;
  let repository: ThresholdRepositoryPort;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findByStatus: vi.fn(),
      findByFilters: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ThresholdRepositoryPort;

    useCase = new DeleteThresholdUseCase(repository);
  });

  it("should call repository.delete with correct ID", async () => {
    const id = ThresholdId.of("123");
    await useCase.delete(id);

    expect(repository.delete).toHaveBeenCalledOnce();
    expect(repository.delete).toHaveBeenCalledWith(id);
  });
});
