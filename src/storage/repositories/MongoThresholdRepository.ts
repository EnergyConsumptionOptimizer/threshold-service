import { ThresholdModel } from "../models/ThresholdModel";
import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
import { ThresholdId } from "@domain/value/ThresholdId";
import { Threshold } from "@domain/Threshold";
import { UtilityType } from "@domain/value/UtilityType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdState } from "@domain/value/ThresholdState";
import { v4 as uuidv4 } from "uuid";
import { MongoError } from "mongodb";
import {
  ThresholdAlreadyExistsError,
  ThresholdNotFoundError,
} from "@domain/errors";
import {
  type ThresholdDoc,
  toDomain,
  toPersistence,
} from "@storage/mappers/thresholdDocumentMapper";

export class MongoThresholdRepository implements ThresholdRepositoryPort {
  async findAll(): Promise<Threshold[]> {
    const docs = await ThresholdModel.find()
      .sort({ createdAt: -1 })
      .lean<ThresholdDoc[]>()
      .exec();
    return docs.map(toDomain);
  }

  async findById(id: ThresholdId): Promise<Threshold | null> {
    const doc = await ThresholdModel.findById(id.value)
      .lean<ThresholdDoc>()
      .exec();
    return doc ? toDomain(doc) : null;
  }

  async findByFilters(
    utilityType?: UtilityType,
    periodType?: PeriodType,
    thresholdType?: ThresholdType,
    thresholdState?: ThresholdState,
  ): Promise<Threshold[]> {
    const filter: Record<string, string> = {};
    if (utilityType) filter.utilityType = utilityType;
    if (periodType) filter.periodType = periodType;
    if (thresholdType) filter.thresholdType = thresholdType;
    if (thresholdState) filter.thresholdState = thresholdState;

    const docs = await ThresholdModel.find(filter)
      .sort({ createdAt: -1 })
      .lean<ThresholdDoc[]>()
      .exec();
    return docs.map(toDomain);
  }

  async save(threshold: Threshold): Promise<Threshold> {
    try {
      const doc = await ThresholdModel.create({
        _id: uuidv4(),
        ...toPersistence(threshold),
      });
      return toDomain(doc.toObject() as ThresholdDoc);
    } catch (error) {
      if ((error as MongoError).code === 11000) {
        throw new ThresholdAlreadyExistsError(
          `${threshold.utilityType}-${threshold.thresholdType}-${threshold.periodType}`,
        );
      }
      throw error;
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
        toPersistence(updated),
        { new: true },
      )
        .lean<ThresholdDoc>()
        .exec();

      return doc ? toDomain(doc) : null;
    } catch (error) {
      if ((error as MongoError).code === 11000) {
        throw new ThresholdAlreadyExistsError(
          `${updated.utilityType}-${updated.thresholdType}-${updated.periodType}`,
        );
      }
      throw error;
    }
  }

  async delete(thresholdId: ThresholdId): Promise<void> {
    await ThresholdModel.deleteOne({ _id: thresholdId.value }).exec();
  }
}
