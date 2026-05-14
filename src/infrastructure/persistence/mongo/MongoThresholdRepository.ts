import { ThresholdNotFoundError } from "@application/errors";
import type { Threshold } from "@domain/entity/Threshold";
import { DuplicateThresholdNameError } from "@domain/errors";
import type {
	ThresholdFilters,
	ThresholdRepository,
} from "@domain/ports/ThresholdRepository";
import type { PeriodType } from "@domain/value/PeriodType";
import type { ThresholdId } from "@domain/value/ThresholdId";
import type { ThresholdType } from "@domain/value/ThresholdType";
import type { UtilityType } from "@domain/value/UtilityType";
import { mongoSessionContext } from "@infrastructure/persistence/mongo/mongoSessionContext";
import mongoose from "mongoose";
import type { Logger } from "pino";
import { toDomain, toPersistence } from "./ThresholdMapper";
import { type ThresholdDoc, ThresholdModel } from "./ThresholdSchema";

export class MongoThresholdRepository implements ThresholdRepository {
	readonly #logger?: Logger;

	constructor(logger?: Logger) {
		this.#logger = logger;
	}

	async findAll(): Promise<Threshold[]> {
		const docs = await ThresholdModel.find()
			.sort({ createdAt: -1 })
			.lean<ThresholdDoc[]>()
			.exec();
		return docs.map(toDomain);
	}

	async findById(id: ThresholdId): Promise<Threshold | undefined> {
		const doc = await ThresholdModel.findById(id.value)
			.lean<ThresholdDoc>()
			.exec();
		return doc ? toDomain(doc) : undefined;
	}

	async findBreached(): Promise<Threshold[]> {
		const docs = await ThresholdModel.find({
			thresholdState: "BREACHED",
		})
			.sort({ createdAt: -1 })
			.lean<ThresholdDoc[]>()
			.exec();
		return docs.map(toDomain);
	}

	async findActive(
		utilityType: UtilityType,
		thresholdType: ThresholdType,
		periodType?: PeriodType,
	): Promise<Threshold[]> {
		const query: Record<string, unknown> = {
			utilityType,
			thresholdType,
			thresholdState: "ENABLED",
		};
		if (periodType) {
			query.periodType = periodType.value;
		}
		const docs = await ThresholdModel.find(query)
			.sort({ createdAt: -1 })
			.lean<ThresholdDoc[]>()
			.exec();
		return docs.map(toDomain);
	}

	async findByFilters(filters: ThresholdFilters): Promise<Threshold[]> {
		const query: Record<string, unknown> = {};

		if (filters.name) {
			query.name = filters.name.value;
		}
		if (filters.utilityType) {
			query.utilityType = filters.utilityType;
		}
		if (filters.periodType) {
			query.periodType = filters.periodType.value;
		}
		if (filters.thresholdType) {
			query.thresholdType = filters.thresholdType;
		}
		if (filters.state) {
			query.thresholdState = filters.state;
		}

		const docs = await ThresholdModel.find(query)
			.sort({ createdAt: -1 })
			.lean<ThresholdDoc[]>()
			.exec();
		return docs.map(toDomain);
	}

	async save(threshold: Threshold): Promise<void> {
		const raw = toPersistence(threshold);
		const session = mongoSessionContext.getStore();

		try {
			await ThresholdModel.replaceOne({ _id: raw._id }, raw, {
				upsert: true,
				runValidators: true,
				session,
			}).exec();
		} catch (err: unknown) {
			if (
				err instanceof mongoose.mongo.MongoServerError &&
				err.code === 11000
			) {
				this.#logger?.warn(
					{ thresholdId: threshold.id.value },
					"Concurrency conflict: duplicate key on save",
				);
				throw new DuplicateThresholdNameError(threshold.name.value);
			}

			this.#logger?.error(
				{ thresholdId: threshold.id.value, err },
				"Database error on save",
			);
			throw err;
		}
	}

	async remove(threshold: Threshold): Promise<void> {
		const session = mongoSessionContext.getStore();
		try {
			const result = await ThresholdModel.findByIdAndDelete(
				threshold.id.value,
				{ session },
			).exec();
			if (!result) {
				throw new ThresholdNotFoundError(threshold.id.value);
			}
		} catch (err) {
			if (err instanceof ThresholdNotFoundError) {
				throw err;
			}
			this.#logger?.error(
				{ thresholdId: threshold.id.value, err },
				"Database error on remove",
			);
			throw err;
		}
	}
}
