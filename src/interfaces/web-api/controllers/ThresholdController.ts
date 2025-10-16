import { NextFunction, Request, Response } from "express";

import { CreateThresholdUseCase } from "@application/usecases/CreateThresholdUseCase";
import { GetThresholdUseCase } from "@application/usecases/GetThresholdUseCase";
import { UpdateThresholdUseCase } from "@application/usecases/UpdateThresholdUseCase";
import { DeleteThresholdUseCase } from "@application/usecases/DeleteThresholdUseCase";
import { ThresholdId } from "@domain/value/ThresholdId";
import { ThresholdNotFoundError } from "@domain/errors";
import {
  createThresholdSchema,
  listThresholdSchema,
  updateThresholdSchema,
} from "@presentation/schemas/thresholdSchemas";
import { thresholdMapper } from "@presentation/mappers/thresholdDTO";

export class ThresholdController {
  constructor(
    private readonly createUC: CreateThresholdUseCase,
    private readonly getUC: GetThresholdUseCase,
    private readonly updateUC: UpdateThresholdUseCase,
    private readonly deleteUC: DeleteThresholdUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createThresholdSchema.parse(req.body);
      const threshold = await this.createUC.save(
        parsed.utilityType,
        parsed.thresholdType,
        parsed.value,
        parsed.isActive,
        parsed.periodType,
      );

      res.status(201).json(thresholdMapper.toDTO(threshold));
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
      const thresholds = await this.getUC.findByFilters(
        parsed.utilityType,
        parsed.periodType,
        parsed.thresholdType,
        parsed.isActive,
      );
      res.status(200).json(thresholdMapper.toDTOs(thresholds));
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const threshold = await this.getUC.findById(
        ThresholdId.of(req.params.id),
      );
      if (!threshold) return next(new ThresholdNotFoundError(req.params.id));

      res.status(200).json(thresholdMapper.toDTO(threshold));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = ThresholdId.of(req.params.id);
      const parsed = updateThresholdSchema.parse(req.body);
      const updated = await this.updateUC.update(id, parsed);

      if (!updated) return next(new ThresholdNotFoundError(req.params.id));
      return res.status(200).json(thresholdMapper.toDTO(updated));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.deleteUC.delete(ThresholdId.of(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
