import { ThresholdModel, ThresholdDocument } from "../models/ThresholdModel";
import { FilterQuery } from "mongoose";
import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { ThresholdId } from "@domain/value/ThresholdId";
import { Threshold } from "@domain/Threshold";
import { ResourceType } from "@domain/value/ResourceType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";

export interface ThresholdPersistence {
  _id: string;
  resourceType: string;
  periodType: string;
  thresholdType: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

export class MongoThresholdRepository implements ThresholdRepositoryPort {
  async findById(id: ThresholdId): Promise<Threshold | undefined> {
    const doc = await ThresholdModel.findById(id.value).lean().exec();
    return doc ? this.toDomain(doc as ThresholdDocument) : undefined;
  }

  async findAll(): Promise<Threshold[]> {
    const docs = await ThresholdModel.find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return docs.map((doc) => this.toDomain(doc as ThresholdDocument));
  }

  async findByFilters(
    resourceType?: ResourceType,
    periodType?: PeriodType,
    thresholdType?: ThresholdType,
  ): Promise<Threshold[]> {
    const filter = this.buildFilter(resourceType, periodType, thresholdType);
    const docs = await ThresholdModel.find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return docs.map((doc) => this.toDomain(doc as ThresholdDocument));
  }

  async save(threshold: Threshold): Promise<void> {
    const doc = this.toPersistence(threshold);
    await ThresholdModel.findByIdAndUpdate(threshold.id.value, doc, {
      upsert: true,
      new: true,
    }).exec();
  }

  async delete(threshold: Threshold): Promise<void> {
    await ThresholdModel.findByIdAndDelete(threshold.id.value).exec();
  }

  private buildFilter(
    resourceType?: ResourceType,
    periodType?: PeriodType,
    thresholdType?: ThresholdType,
  ): FilterQuery<ThresholdDocument> {
    const filter: FilterQuery<ThresholdDocument> = {};
    if (resourceType) filter.resourceType = resourceType;
    if (periodType) filter.periodType = periodType;
    if (thresholdType) filter.thresholdType = thresholdType;
    return filter;
  }

  private toDomain(doc: ThresholdDocument): Threshold {
    return Threshold.reconstitute({
      id: doc._id,
      resourceType: doc.resourceType as ResourceType,
      periodType: doc.periodType as PeriodType,
      thresholdType: doc.thresholdType as ThresholdType,
      value: doc.value,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    });
  }

  private toPersistence(threshold: Threshold): ThresholdPersistence {
    return {
      _id: threshold.id.value,
      resourceType: threshold.resourceType,
      periodType: threshold.periodType,
      thresholdType: threshold.thresholdType,
      value: threshold.value.value,
      createdAt: threshold.createdAt,
      updatedAt: threshold.updatedAt,
    };
  }
}
