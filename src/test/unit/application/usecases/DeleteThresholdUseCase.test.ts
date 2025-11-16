import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteThresholdUseCase } from "@application/usecases/DeleteThresholdUseCase";
import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { ThresholdId } from "@domain/value/ThresholdId";

describe("DeleteThresholdUseCase", () => {
  let useCase: DeleteThresholdUseCase;
  let repository: ThresholdRepositoryPort;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
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
