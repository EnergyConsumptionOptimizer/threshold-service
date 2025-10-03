import { CreateThresholdUseCase } from "@application/usecases/CreateThresholdUseCase";
import { GetThresholdUseCase } from "@application/usecases/GetThresholdUseCase";
import { GetThresholdsUseCase } from "@application/usecases/GetThresholdsUseCase";
import { DeleteThresholdUseCase } from "@application/usecases/DeleteThresholdUseCase";
import { UpdateThresholdUseCase } from "@application/usecases/UpdateThresholdUseCase";
import { ThresholdController } from "@interfaces/web-api/controllers/ThresholdController";
import { AuthMiddleware } from "@interfaces/web-api/middlewares/AuthMiddleware";
import { router } from "@interfaces/web-api/routes/router";
import { InMemoryThresholdRepository } from "../../../utils/InMemoryThresholdRepository";

export const thresholdsRepository = new InMemoryThresholdRepository();

// ===== Services =====
export const createThresholdUseCase = new CreateThresholdUseCase(
  thresholdsRepository,
);
export const getThresholdUseCase = new GetThresholdUseCase(
  thresholdsRepository,
);
export const getThresholdsUseCase = new GetThresholdsUseCase(
  thresholdsRepository,
);
export const deleteThresholdUseCase = new DeleteThresholdUseCase(
  thresholdsRepository,
);
export const updateThresholdUseCase = new UpdateThresholdUseCase(
  thresholdsRepository,
);

// ===== Controllers =====
const thresholdController = new ThresholdController(
  createThresholdUseCase,
  getThresholdsUseCase,
  getThresholdUseCase,
  updateThresholdUseCase,
  deleteThresholdUseCase,
);

// ===== Middlewares =====
export const authMiddleware = new AuthMiddleware();

// ===== Router =====
export const apiRouter = router(thresholdController, authMiddleware);
