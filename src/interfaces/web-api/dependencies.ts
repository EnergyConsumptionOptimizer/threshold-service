import { MongoThresholdRepository } from "@storage/repositories/MongoThresholdRepository";
import { ThresholdController } from "@interfaces/web-api/controllers/ThresholdController";
import { AuthMiddleware } from "@interfaces/web-api/middlewares/AuthMiddleware";
import { router } from "@interfaces/web-api/routes/router";
import { ResetThresholdUseCase } from "@application/usecases/ResetThresholdUseCase";
import { ThresholdResetScheduler } from "@interfaces/ThresholdResetScheduler";
import { ThresholdMonitoringService } from "@application/services/ThresholdMonitoringService";
import { SocketIOThresholdNotificationAdapter } from "@interfaces/SocketIOThresholdNotificationAdapter";
import { ConsumptionEvaluationService } from "@application/services/ConsumptionEvaluationService";
import { ConsumptionEventListener } from "@interfaces/ConsumptionEventListener";
import { HttpAlertServiceAdapter } from "@interfaces/HttpAlertServiceAdapter";
import type { ThresholdBreachNotificationPort } from "@domain/port/ThresholdBreachNotificationPort";

const ALERT_SERVICE_URL =
  process.env.ALERT_SERVICE_URL || "http://localhost:3002";
const MONITORING_SERVICE_URL =
  process.env.MONITORING_SERVICE_URL || "http://localhost:3001";
const MONITORING_INTERVAL_MS = 10000;

const repository = new MongoThresholdRepository();

const alertService = new HttpAlertServiceAdapter(ALERT_SERVICE_URL);

const breachNotificationPort: ThresholdBreachNotificationPort = {
  async notifyThresholdsBreach(consumption, breachedThresholds) {
    for (const threshold of breachedThresholds) {
      await alertService.notifyBreach(threshold, consumption.value);
    }
  },
};

const evaluationService = new ConsumptionEvaluationService(
  repository,
  breachNotificationPort,
);

const thresholdController = new ThresholdController(
  repository,
  evaluationService,
);

export const authMiddleware = new AuthMiddleware();
export const apiRouter = router(thresholdController, authMiddleware);

const resetUseCase = new ResetThresholdUseCase(repository);
export const thresholdResetScheduler = new ThresholdResetScheduler(
  resetUseCase,
);

const socketAdapter = new SocketIOThresholdNotificationAdapter(
  MONITORING_SERVICE_URL,
);

export const thresholdMonitoringService = new ThresholdMonitoringService(
  repository,
  socketAdapter,
  MONITORING_INTERVAL_MS,
);

export function createConsumptionEventListener() {
  return new ConsumptionEventListener(
    MONITORING_SERVICE_URL,
    evaluationService,
  );
}
