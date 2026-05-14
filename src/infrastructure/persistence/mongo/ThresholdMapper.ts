import { Threshold } from "@domain/entity/Threshold";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdId } from "@domain/value/ThresholdId";
import { ThresholdName } from "@domain/value/ThresholdName";
import type { ThresholdState } from "@domain/value/ThresholdState";
import type { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import type { UtilityType } from "@domain/value/UtilityType";
import type { ThresholdDoc } from "./ThresholdSchema";

export function toDomain(doc: ThresholdDoc): Threshold {
	const id = ThresholdId.of(doc._id);
	if (id instanceof Error) {
		throw new Error(
			`Corrupt database record: invalid ThresholdId for ${doc._id}`,
		);
	}

	const name = ThresholdName.of(doc.name);
	if (name instanceof Error) {
		throw new Error(
			`Corrupt database record: invalid ThresholdName for ${doc._id}`,
		);
	}

	const value = ThresholdValue.of(doc.value);
	if (value instanceof Error) {
		throw new Error(
			`Corrupt database record: invalid ThresholdValue for ${doc._id}`,
		);
	}

	let periodType: PeriodType | undefined;
	if (doc.periodType) {
		const parsed = PeriodType.of(doc.periodType);
		if (parsed instanceof Error) {
			throw new Error(
				`Corrupt database record: invalid PeriodType for ${doc._id}`,
			);
		}
		periodType = parsed;
	}

	return Threshold.restore(
		id,
		name,
		doc.utilityType as UtilityType,
		value,
		doc.thresholdType as ThresholdType,
		doc.thresholdState as ThresholdState,
		periodType,
	);
}

interface PersistenceThreshold {
	_id: string;
	name: string;
	utilityType: string;
	thresholdType: string;
	periodType?: string | null;
	value: number;
	thresholdState: string;
}

export function toPersistence(threshold: Threshold): PersistenceThreshold {
	return {
		_id: threshold.id.value,
		name: threshold.name.value,
		utilityType: threshold.utilityType,
		thresholdType: threshold.thresholdType,
		periodType: threshold.periodType?.value ?? null,
		value: threshold.value.value,
		thresholdState: threshold.thresholdState,
	};
}
