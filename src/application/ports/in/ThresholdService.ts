import type { ThresholdNotFoundError } from "@application/errors";
import type {
	ActualThresholdWithPeriodError,
	DuplicateThresholdNameError,
	InvalidThresholdIdError,
	InvalidThresholdNameError,
	InvalidThresholdValueError,
	MissingPeriodTypeForThresholdError,
} from "@domain/errors";
import type { ThresholdFilters } from "@domain/ports/ThresholdRepository";
import type { PeriodType } from "@domain/value/PeriodType";
import type { ThresholdState } from "@domain/value/ThresholdState";
import type { ThresholdType } from "@domain/value/ThresholdType";
import type { UtilityType } from "@domain/value/UtilityType";

export interface ThresholdOutput {
	readonly id: string;
	readonly name: string;
	readonly utilityType: string;
	readonly value: number;
	readonly thresholdType: string;
	readonly thresholdState: string;
	readonly periodType?: string;
}

export interface CreateThresholdParams {
	readonly name: string;
	readonly utilityType: UtilityType;
	readonly value: number;
	readonly thresholdType: ThresholdType;
	readonly periodType?: PeriodType;
}

export interface UpdateThresholdParams {
	readonly name?: string;
	readonly value?: number;
	readonly thresholdState?: ThresholdState;
	readonly periodType?: PeriodType;
	readonly thresholdType?: ThresholdType;
	readonly utilityType?: UtilityType;
}

export type CreateThresholdResponse =
	| ThresholdOutput
	| InvalidThresholdIdError
	| InvalidThresholdNameError
	| InvalidThresholdValueError
	| ActualThresholdWithPeriodError
	| MissingPeriodTypeForThresholdError
	| DuplicateThresholdNameError;

export type GetThresholdByIdResponse =
	| ThresholdOutput
	| InvalidThresholdIdError
	| ThresholdNotFoundError;

export type ListThresholdsResponse = ThresholdOutput[];

export type UpdateThresholdResponse =
	| ThresholdOutput
	| InvalidThresholdIdError
	| InvalidThresholdNameError
	| InvalidThresholdValueError
	| ActualThresholdWithPeriodError
	| MissingPeriodTypeForThresholdError
	| DuplicateThresholdNameError
	| ThresholdNotFoundError;

export type DeleteThresholdResponse =
	| undefined
	| InvalidThresholdIdError
	| ThresholdNotFoundError;

export type ResetThresholdsResponse =
	| ThresholdOutput[]
	| InvalidThresholdIdError;

export interface ThresholdService {
	create(params: CreateThresholdParams): Promise<CreateThresholdResponse>;
	getById(id: string): Promise<GetThresholdByIdResponse>;
	list(filters: ThresholdFilters): Promise<ListThresholdsResponse>;
	update(
		id: string,
		updates: UpdateThresholdParams,
	): Promise<UpdateThresholdResponse>;
	delete(id: string): Promise<DeleteThresholdResponse>;
	reset(): Promise<ResetThresholdsResponse>;
}
