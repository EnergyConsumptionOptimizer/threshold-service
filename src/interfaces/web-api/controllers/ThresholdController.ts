import { NextFunction, Request, Response } from "express";
import { ThresholdRepositoryPort } from "@domain/port/ThresholdRepositoryPort";
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
import { Threshold } from "@domain/Threshold";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { ThresholdState } from "@domain/value/ThresholdState";
import { ConsumptionEvaluationService } from "@application/services/ConsumptionEvaluationService";

export class ThresholdController {
  constructor(
    private readonly repository: ThresholdRepositoryPort,
    private readonly evaluationService: ConsumptionEvaluationService,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createThresholdSchema.parse(req.body);

      const threshold = Threshold.create(
        ThresholdId.of("id-placeholder"),
        parsed.utilityType,
        ThresholdValue.of(parsed.value),
        parsed.thresholdType,
        parsed.thresholdState ?? ThresholdState.ENABLED,
        parsed.periodType,
      );

      const saved = await this.repository.save(threshold);
      res.status(201).json(toThresholdDTO(saved));
    } catch (error) {
      next(error);
    }
  };

  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = listThresholdSchema.parse(req.query);
      const thresholds = await this.repository.findByFilters(
        parsed.utilityType,
        parsed.periodType,
        parsed.thresholdType,
        parsed.thresholdState,
      );
      res.status(200).json(toThresholdDTOs(thresholds));
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const threshold = await this.repository.findById(
        ThresholdId.of(req.params.id),
      );
      if (!threshold) return next(new ThresholdNotFoundError(req.params.id));

      res.status(200).json(toThresholdDTO(threshold));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = ThresholdId.of(req.params.id);
      const { value, ...rest } = updateThresholdSchema.parse(req.body);

      const updates: Partial<Threshold> = {
        ...rest,
        ...(value !== undefined && { value: ThresholdValue.of(value) }),
      };

      const updated = await this.repository.update(id, updates);

      if (!updated) return next(new ThresholdNotFoundError(req.params.id));
      res.status(200).json(toThresholdDTO(updated));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.repository.delete(ThresholdId.of(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  evaluateForecast = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = evaluateThresholdSchema.parse(req.body);

      const breached = await this.evaluationService.evaluateConsumption({
        utilityType: parsed.utilityType,
        thresholdType: ThresholdType.FORECAST,
        periodType: parsed.periodType,
        value: parsed.value,
      });

      res.status(201).json(toThresholdDTOs(breached));
    } catch (error) {
      next(error);
    }
  };
}
