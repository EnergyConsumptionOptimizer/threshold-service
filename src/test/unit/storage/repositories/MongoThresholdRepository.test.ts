import { describe, it, expect, beforeEach, vi } from "vitest";
import { MongoThresholdRepository } from "@storage/repositories/MongoThresholdRepository";
import { ThresholdModel } from "@storage/models/ThresholdModel";
import { ThresholdId } from "@domain/value/ThresholdId";
import { ResourceType } from "@domain/value/ResourceType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { Threshold } from "@domain/Threshold";
import type { Query } from "mongoose";
import type { ThresholdDocument } from "@storage/models/ThresholdModel";

vi.mock("../../../../storage/models/ThresholdModel");

const mockChain = <T>(value: T) =>
  ({
    lean: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(value),
    sort: vi.fn().mockReturnThis(),
  }) as unknown as Query<T, ThresholdDocument>;

const mockDoc = {
  _id: "123e4567-e89b-12d3-a456-426614174000",
  resourceType: "electricity",
  periodType: "daily",
  thresholdType: "actual",
  value: 100,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

describe("MongoThresholdRepository", () => {
  let repository: MongoThresholdRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new MongoThresholdRepository();
  });

  describe("findById", () => {
    it("returns threshold when found", async () => {
      vi.mocked(ThresholdModel.findById).mockReturnValue(mockChain(mockDoc));

      const result = await repository.findById(ThresholdId.of(mockDoc._id));

      expect(result?.id.value).toBe(mockDoc._id);
    });

    it("returns undefined when not found", async () => {
      vi.mocked(ThresholdModel.findById).mockReturnValue(mockChain(null));

      const result = await repository.findById(ThresholdId.of(mockDoc._id));

      expect(result).toBeUndefined();
    });
  });

  describe("findAll", () => {
    it("returns all thresholds sorted by createdAt", async () => {
      vi.mocked(ThresholdModel.find).mockReturnValue(mockChain([mockDoc]));

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id.value).toBe(mockDoc._id);
    });
  });

  describe("findByFilters", () => {
    it("filters by resource type", async () => {
      vi.mocked(ThresholdModel.find).mockReturnValue(mockChain([mockDoc]));

      await repository.findByFilters(ResourceType.ELECTRICITY);

      expect(ThresholdModel.find).toHaveBeenCalledWith({
        resourceType: ResourceType.ELECTRICITY,
      });
    });

    it("filters by multiple types", async () => {
      vi.mocked(ThresholdModel.find).mockReturnValue(mockChain([mockDoc]));

      await repository.findByFilters(
        ResourceType.ELECTRICITY,
        PeriodType.DAILY,
        ThresholdType.ACTUAL,
      );

      expect(ThresholdModel.find).toHaveBeenCalledWith({
        resourceType: ResourceType.ELECTRICITY,
        periodType: PeriodType.DAILY,
        thresholdType: ThresholdType.ACTUAL,
      });
    });
  });

  describe("save", () => {
    it("upserts threshold", async () => {
      const execMock = { exec: vi.fn().mockResolvedValue(mockDoc) };
      vi.mocked(ThresholdModel.findByIdAndUpdate).mockReturnValue(
        execMock as unknown as Query<
          ThresholdDocument | null,
          ThresholdDocument
        >,
      );

      const threshold = Threshold.create({
        resourceType: ResourceType.ELECTRICITY,
        periodType: PeriodType.DAILY,
        thresholdType: ThresholdType.ACTUAL,
        value: 100,
      });

      await repository.save(threshold);

      expect(ThresholdModel.findByIdAndUpdate).toHaveBeenCalledWith(
        threshold.id.value,
        expect.objectContaining({ value: 100 }),
        { upsert: true, new: true },
      );
    });
  });

  describe("delete", () => {
    it("deletes threshold by id", async () => {
      const execMock = { exec: vi.fn().mockResolvedValue(mockDoc) };
      vi.mocked(ThresholdModel.findByIdAndDelete).mockReturnValue(
        execMock as unknown as Query<
          ThresholdDocument | null,
          ThresholdDocument
        >,
      );

      const threshold = Threshold.reconstitute({
        id: mockDoc._id,
        resourceType: ResourceType.ELECTRICITY,
        periodType: PeriodType.DAILY,
        thresholdType: ThresholdType.ACTUAL,
        value: 100,
        createdAt: mockDoc.createdAt,
        updatedAt: mockDoc.updatedAt,
      });

      await repository.delete(threshold);

      expect(ThresholdModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockDoc._id,
      );
    });
  });
});
