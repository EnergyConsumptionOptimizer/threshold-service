import { NextFunction, Request, Response } from "express";
import { thresholdDTOMapper } from "@presentation/mappers/thresholdDTO";
import { CreateThresholdUseCase } from "@application/usecases/CreateThresholdUseCase";
import { GetThresholdsUseCase } from "@application/usecases/GetThresholdsUseCase";
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

export class ThresholdController {
  constructor(
    private readonly createUC: CreateThresholdUseCase,
    private readonly listUC: GetThresholdsUseCase,
    private readonly getUC: GetThresholdUseCase,
    private readonly updateUC: UpdateThresholdUseCase,
    private readonly deleteUC: DeleteThresholdUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createThresholdSchema.parse(req.body);
      const threshold = await this.createUC.execute(
        parsed.resourceType,
        parsed.periodType,
        parsed.thresholdType,
        parsed.value,
      );

      res.status(201).json(thresholdDTOMapper.toDTO(threshold));
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = listThresholdSchema.parse(req.query);
      const thresholds = await this.listUC.execute(
        parsed.resourceType,
        parsed.periodType,
        parsed.thresholdType,
      );

      res.status(200).json(thresholdDTOMapper.toDTOs(thresholds));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const threshold = await this.getUC.executeById(
        ThresholdId.of(req.params.id),
      );
      if (!threshold) return next(new ThresholdNotFoundError(req.params.id));

      res.status(200).json(thresholdDTOMapper.toDTO(threshold));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateThresholdSchema.parse(req.body);
      const updated = await this.updateUC.executeById(
        ThresholdId.of(req.params.id),
        parsed.value,
      );

      res.status(201).json(thresholdDTOMapper.toDTO(updated));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.deleteUC.execute(ThresholdId.of(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
