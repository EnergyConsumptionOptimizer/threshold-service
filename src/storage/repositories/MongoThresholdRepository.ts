import { MongoError } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import {
  ThresholdFilters,
  ThresholdRepositoryPort,
} from "@domain/port/ThresholdRepositoryPort";
import { Threshold } from "@domain/Threshold";
import { ThresholdId } from "@domain/value/ThresholdId";
import {
  ThresholdAlreadyExistsError,
  ThresholdNotFoundError,
} from "@domain/errors";
import { ThresholdModel } from "../models/ThresholdModel";
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

  async findByFilters(filters: ThresholdFilters): Promise<Threshold[]> {
    const mongoQuery = {
      ...(filters.name && { name: filters.name.toString() }),
      ...(filters.utilityType && { utilityType: filters.utilityType }),
      ...(filters.periodType && { periodType: filters.periodType }),
      ...(filters.thresholdType && { thresholdType: filters.thresholdType }),
      ...(filters.state && { thresholdState: filters.state }),
    };

    const docs = await ThresholdModel.find(mongoQuery)
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
        throw new ThresholdAlreadyExistsError(threshold.name.toString());
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
        throw new ThresholdAlreadyExistsError(updated.name.toString());
      }
      throw error;
    }
  }

  async delete(thresholdId: ThresholdId): Promise<void> {
    await ThresholdModel.deleteOne({ _id: thresholdId.value }).exec();
  }
}
