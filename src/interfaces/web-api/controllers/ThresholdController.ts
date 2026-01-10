import { NextFunction, Request, Response } from "express";
import { ThresholdId } from "@domain/value/ThresholdId";
import { ThresholdNotFoundError } from "@domain/errors";
import {
  createThresholdSchema,
  evaluateThresholdSchema,
  listThresholdSchema,
  updateThresholdSchema,
} from "@presentation/schemas/thresholdSchemas";
import {
  toThresholdDTO,
  toThresholdDTOs,
} from "@presentation/mappers/thresholdDTO";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { Threshold } from "@domain/Threshold";
import { CreateThresholdUseCase } from "@application/usecases/CreateThresholdUseCase";
import { ListThresholdsUseCase } from "@application/usecases/ListThresholdsUseCase";
import { GetThresholdByIdUseCase } from "@application/usecases/GetThresholdByIdUseCase";
import { UpdateThresholdUseCase } from "@application/usecases/UpdateThresholdUseCase";
import { DeleteThresholdUseCase } from "@application/usecases/DeleteThresholdUseCase";
import { EvaluateForecastUseCase } from "@application/usecases/EvaluateForecastUseCase";

/**
 * Express request handlers for threshold-related endpoints.
 *
 * The controller parses request input, delegates to use cases, and maps results to DTOs.
 */
export class ThresholdController {
  constructor(
    private readonly createThresholdUseCase: CreateThresholdUseCase,
    private readonly listThresholdsUseCase: ListThresholdsUseCase,
    private readonly getThresholdByIdUseCase: GetThresholdByIdUseCase,
    private readonly updateThresholdUseCase: UpdateThresholdUseCase,
    private readonly deleteThresholdUseCase: DeleteThresholdUseCase,
    private readonly evaluateForecastUseCase: EvaluateForecastUseCase,
  ) {}

  /**
   * Create a threshold.
   *
   * @returns A 201 response containing the created threshold DTO.
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createThresholdSchema.parse(req.body);

      const saved = await this.createThresholdUseCase.execute({
        name: parsed.name,
        utilityType: parsed.utilityType,
        value: parsed.value,
        thresholdType: parsed.thresholdType,
        thresholdState: parsed.thresholdState,
        periodType: parsed.periodType,
      });
      res.status(201).json(toThresholdDTO(saved));
    } catch (error) {
      next(error);
    }
  };

  /**
   * List thresholds filtered by query parameters.
   *
   * @returns A 200 response containing an array of threshold DTOs.
   */
  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = listThresholdSchema.parse(req.query);
      const thresholds = await this.listThresholdsUseCase.execute({
        name: parsed.name,
        utilityType: parsed.utilityType,
        periodType: parsed.periodType,
        thresholdType: parsed.thresholdType,
        state: parsed.thresholdState,
      });
      res.status(200).json(toThresholdDTOs(thresholds));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a threshold by id.
   *
   * @returns A 200 response containing the threshold DTO.
   */
  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const threshold = await this.getThresholdByIdUseCase.execute(
        ThresholdId.of(req.params.id),
      );
      if (!threshold) return next(new ThresholdNotFoundError(req.params.id));

      res.status(200).json(toThresholdDTO(threshold));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update an existing threshold.
   *
   * @returns A 200 response containing the updated threshold DTO.
   */
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = ThresholdId.of(req.params.id);
      const { value, ...rest } = updateThresholdSchema.parse(req.body);

      const updates: Partial<Threshold> = {
        ...rest,
        ...(value !== undefined && { value: ThresholdValue.of(value) }),
      };

      const updated = await this.updateThresholdUseCase.execute(id, updates);

      if (!updated) return next(new ThresholdNotFoundError(req.params.id));
      res.status(200).json(toThresholdDTO(updated));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a threshold.
   *
   * @returns A 204 response when deletion succeeds.
   */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.deleteThresholdUseCase.execute(ThresholdId.of(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * Evaluate forecasted consumption aggregations against thresholds.
   *
   * @returns A 201 response containing the thresholds that match the forecast.
   */
  evaluateForecast = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = evaluateThresholdSchema.parse(req.body);

      const thresholds = await this.evaluateForecastUseCase.execute({
        utilityType: parsed.utilityType,
        aggregations: parsed.aggregations,
      });

      res.status(201).json(toThresholdDTOs(thresholds));
    } catch (error) {
      next(error);
    }
  };
}
