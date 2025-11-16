import { ThresholdDocument, ThresholdModel } from "../models/ThresholdModel";
import { FilterQuery } from "mongoose";
import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { ThresholdId } from "@domain/value/ThresholdId";
import { Threshold } from "@domain/Threshold";
import { UtilityType } from "@domain/value/UtilityType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { v4 as uuidv4 } from "uuid";
import { MongoError } from "mongodb";
import {
  ThresholdAlreadyExistsError,
  ThresholdNotFoundError,
} from "@domain/errors";
import {
  ThresholdDoc,
  thresholdMapper,
} from "@presentation/mappers/thresholdDTO";
import { ThresholdState } from "@domain/value/ThresholdState";

export class MongoThresholdRepository implements ThresholdRepositoryPort {
  async findAll(): Promise<Threshold[]> {
    const docs = await ThresholdModel.find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return docs.map((doc) => thresholdMapper.toDomain(doc as ThresholdDoc));
  }

  async findById(id: ThresholdId): Promise<Threshold | null> {
    const doc = await ThresholdModel.findById(id.value).lean().exec();
    return doc ? thresholdMapper.toDomain(doc as ThresholdDoc) : null;
  }

  async findByFilters(
    utilityType?: UtilityType,
    periodType?: PeriodType,
    thresholdType?: ThresholdType,
    thresholdState?: ThresholdState,
  ): Promise<Threshold[]> {
    const filter: FilterQuery<ThresholdDocument> = {
      ...(utilityType && { utilityType }),
      ...(periodType && { periodType }),
      ...(thresholdType && { thresholdType }),
      ...(thresholdState && { ThresholdState }),
    };

    const docs = await ThresholdModel.find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return docs.map((doc) => thresholdMapper.toDomain(doc as ThresholdDoc));
  }

  async save(threshold: Threshold): Promise<Threshold> {
    try {
      const doc = await ThresholdModel.create({
        _id: uuidv4(),
        ...thresholdMapper.toPersistence(threshold),
      });
      return thresholdMapper.toDomain(doc.toObject() as ThresholdDoc);
    } catch (error) {
      this.handleMongoError(error, threshold);
    }
  }

  async update(
    thresholdID: ThresholdId,
    attrs: Partial<Threshold>,
  ): Promise<Threshold | null> {
    const existing = await this.findById(thresholdID);
    if (!existing) throw new ThresholdNotFoundError(thresholdID.value);

    const updated = existing.update(attrs);

    try {
      const doc = await ThresholdModel.findByIdAndUpdate(
        thresholdID.value,
        thresholdMapper.toPersistence(updated),
        { new: true },
      )
        .lean()
        .exec();

      return doc ? thresholdMapper.toDomain(doc as ThresholdDoc) : null;
    } catch (error) {
      this.handleMongoError(error, updated);
    }
  }

  async delete(thresholdId: ThresholdId): Promise<void> {
    await ThresholdModel.deleteOne({ _id: thresholdId.value }).exec();
  }

  private handleMongoError(error: unknown, threshold: Threshold): never {
    if ((error as MongoError).code === 11000) {
      throw new ThresholdAlreadyExistsError(
        `${threshold.utilityType}-${threshold.thresholdType}-${threshold.periodType} already exists`,
      );
    }
    throw error;
  }
}
