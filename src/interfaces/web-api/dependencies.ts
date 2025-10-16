import { MongoThresholdRepository } from "@storage/repositories/MongoThresholdRepository";
import { CreateThresholdUseCase } from "@application/usecases/CreateThresholdUseCase";
import { GetThresholdUseCase } from "@application/usecases/GetThresholdUseCase";
import { DeleteThresholdUseCase } from "@application/usecases/DeleteThresholdUseCase";
import { UpdateThresholdUseCase } from "@application/usecases/UpdateThresholdUseCase";
import { ThresholdController } from "@interfaces/web-api/controllers/ThresholdController";
import { AuthMiddleware } from "@interfaces/web-api/middlewares/AuthMiddleware";
import { router } from "@interfaces/web-api/routes/router";

export const thresholdsRepository = new MongoThresholdRepository();

export const createThresholdUseCase = new CreateThresholdUseCase(
  thresholdsRepository,
);
export const getThresholdUseCase = new GetThresholdUseCase(
  thresholdsRepository,
);
export const deleteThresholdUseCase = new DeleteThresholdUseCase(
  thresholdsRepository,
);
export const updateThresholdUseCase = new UpdateThresholdUseCase(
  thresholdsRepository,
);

const thresholdController = new ThresholdController(
  createThresholdUseCase,
  getThresholdUseCase,
  updateThresholdUseCase,
  deleteThresholdUseCase,
);

export const authMiddleware = new AuthMiddleware();

export const apiRouter = router(thresholdController, authMiddleware);
