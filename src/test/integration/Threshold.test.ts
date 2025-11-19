import request from "supertest";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Express } from "express";
import {
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from "./setup/testDatabase";
import { createTestApp } from "./setup/testApp";
import { thresholdFactory } from "./fixtures/thresholdFactory";
import {
  clearAuthMocks,
  mockAdminAuthFailure,
  mockAdminAuthSuccess,
  mockAuthSuccess,
} from "./mocks/authMocks";
import { ThresholdDTO } from "@presentation/mappers/thresholdDTO";

describe("Threshold API Integration Tests", () => {
  let app: Express;
  const authToken = "Bearer valid-token";

  beforeAll(async () => {
    await setupTestDatabase();
    app = createTestApp();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterEach(() => {
    clearAuthMocks();
  });

  describe("POST /api/thresholds", () => {
    it("should create an actual threshold successfully", async () => {
      mockAdminAuthSuccess();
      const payload = thresholdFactory.validActual();

      const response = await request(app)
        .post("/api/thresholds")
        .set("Authorization", authToken)
        .send(payload)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        utilityType: payload.utilityType,
        thresholdType: payload.thresholdType,
        value: payload.value,
        thresholdState: payload.thresholdState,
      });
      expect(response.body.periodType).toBeUndefined();
    });

    it("should create a historical threshold with period", async () => {
      mockAdminAuthSuccess();
      const payload = thresholdFactory.validHistorical();

      const response = await request(app)
        .post("/api/thresholds")
        .set("Authorization", authToken)
        .send(payload)
        .expect(201);

      expect(response.body).toMatchObject({
        utilityType: payload.utilityType,
        thresholdType: payload.thresholdType,
        periodType: payload.periodType,
        value: payload.value,
        thresholdState: payload.thresholdState,
      });
    });

    it("should create a forecast threshold with period", async () => {
      mockAdminAuthSuccess();
      const payload = thresholdFactory.validForecast();

      const response = await request(app)
        .post("/api/thresholds")
        .set("Authorization", authToken)
        .send(payload)
        .expect(201);

      expect(response.body.thresholdType).toBe(payload.thresholdType);
      expect(response.body.periodType).toBe(payload.periodType);
    });

    it("should return 401 when no auth token provided", async () => {
      const payload = thresholdFactory.validActual();

      await request(app).post("/api/thresholds").send(payload).expect(401);
    });

    it("should return 403 when user is not admin", async () => {
      mockAdminAuthFailure();
      const payload = thresholdFactory.validActual();

      await request(app)
        .post("/api/thresholds")
        .set("Authorization", authToken)
        .send(payload)
        .expect(403);
    });

    it("should return 400 for negative threshold value", async () => {
      mockAdminAuthSuccess();
      const payload = thresholdFactory.invalid.negativeValue();

      const response = await request(app)
        .post("/api/thresholds")
        .set("Authorization", authToken)
        .send(payload)
        .expect(400);

      expect(response.body.error).toBe("ValidationError");
    });

    it("should return 400 for actual threshold with period", async () => {
      mockAdminAuthSuccess();
      const payload = thresholdFactory.invalid.actualWithPeriod();

      await request(app)
        .post("/api/thresholds")
        .set("Authorization", authToken)
        .send(payload)
        .expect(400);
    });

    it("should return 400 for historical threshold without period", async () => {
      mockAdminAuthSuccess();
      const payload = thresholdFactory.invalid.historicalWithoutPeriod();

      await request(app)
        .post("/api/thresholds")
        .set("Authorization", authToken)
        .send(payload)
        .expect(400);
    });

    it("should return 400 for missing required fields", async () => {
      mockAdminAuthSuccess();
      const payload = thresholdFactory.invalid.missingRequiredFields();

      const response = await request(app)
        .post("/api/thresholds")
        .set("Authorization", authToken)
        .send(payload)
        .expect(400);

      expect(response.body.error).toBe("ValidationError");
      expect(response.body.details).toBeInstanceOf(Array);
    });
  });

  describe("GET /api/thresholds", () => {
    beforeEach(async () => {
      mockAdminAuthSuccess();

      await request(app)
        .post("/api/thresholds")
        .set("Authorization", authToken)
        .send(thresholdFactory.validActual());

      await request(app)
        .post("/api/thresholds")
        .set("Authorization", authToken)
        .send(thresholdFactory.validHistorical());

      await request(app)
        .post("/api/thresholds")
        .set("Authorization", authToken)
        .send(thresholdFactory.validForecast());
    });

    it("should list all thresholds", async () => {
      mockAuthSuccess();

      const response = await request(app)
        .get("/api/thresholds")
        .set("Authorization", authToken)
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("utilityType");
    });

    it("should filter thresholds by utility type", async () => {
      mockAuthSuccess();

      const response = await request(app)
        .get("/api/thresholds")
        .query({ utilityType: "ELECTRICITY" })
        .set("Authorization", authToken)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].utilityType).toBe("ELECTRICITY");
    });

    it("should filter thresholds by threshold type", async () => {
      mockAuthSuccess();

      const response = await request(app)
        .get("/api/thresholds")
        .query({ thresholdType: "HISTORICAL" })
        .set("Authorization", authToken)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].thresholdType).toBe("HISTORICAL");
    });

    it("should filter thresholds by period type", async () => {
      mockAuthSuccess();

      const response = await request(app)
        .get("/api/thresholds")
        .query({ periodType: "ONE_WEEK" })
        .set("Authorization", authToken)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].periodType).toBe("ONE_WEEK");
    });

    it("should filter thresholds by thresholdState", async () => {
      mockAuthSuccess();

      const response = await request(app)
        .get("/api/thresholds/")
        .query({ thresholdState: "ENABLED" })
        .set("Authorization", authToken)
        .expect(200);

      response.body.forEach((t: ThresholdDTO) => {
        expect(t.thresholdState).toBe("ENABLED");
      });
    });

    it("should filter by multiple criteria", async () => {
      mockAuthSuccess();

      const response = await request(app)
        .get("/api/thresholds")
        .query({
          utilityType: "GAS",
          thresholdType: "HISTORICAL",
        })
        .set("Authorization", authToken)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].utilityType).toBe("GAS");
      expect(response.body[0].thresholdType).toBe("HISTORICAL");
    });

    it("should return 401 without authentication", async () => {
      await request(app).get("/api/thresholds").expect(401);
    });

    it("should return empty array when no thresholds match filters", async () => {
      mockAuthSuccess();

      const response = await request(app)
        .get("/api/thresholds")
        .query({ utilityType: "WATER", thresholdType: "ACTUAL" })
        .set("Authorization", authToken)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe("GET /api/thresholds/:id", () => {
    let createdThresholdId: string;

    beforeEach(async () => {
      mockAdminAuthSuccess();
      const createResponse = await request(app)
        .post("/api/thresholds")
        .set("Authorization", authToken)
        .send(thresholdFactory.validActual());

      createdThresholdId = createResponse.body.id;
    });

    it("should get threshold by id", async () => {
      mockAuthSuccess();

      const response = await request(app)
        .get(`/api/thresholds/${createdThresholdId}`)
        .set("Authorization", authToken)
        .expect(200);

      expect(response.body.id).toBe(createdThresholdId);
      expect(response.body.utilityType).toBe("ELECTRICITY");
    });

    it("should return 404 for non-existent id", async () => {
      mockAuthSuccess();

      const response = await request(app)
        .get("/api/thresholds/507f1f77bcf86cd799439011")
        .set("Authorization", authToken)
        .expect(404);

      expect(response.body.error).toContain("not found");
    });

    it("should return 401 without authentication", async () => {
      await request(app)
        .get(`/api/thresholds/${createdThresholdId}`)
        .expect(401);
    });
  });

  describe("PUT /api/thresholds/:id", () => {
    let createdThresholdId: string;

    beforeEach(async () => {
      mockAdminAuthSuccess();
      const createResponse = await request(app)
        .post("/api/thresholds")
        .set("Authorization", authToken)
        .send(thresholdFactory.validActual());

      createdThresholdId = createResponse.body.id;
    });

    it("should update threshold value", async () => {
      mockAdminAuthSuccess();
      const updatePayload = { value: 250 };

      const response = await request(app)
        .put(`/api/thresholds/${createdThresholdId}`)
        .set("Authorization", authToken)
        .send(updatePayload)
        .expect(200);

      expect(response.body.value).toBe(250);
      expect(response.body.utilityType).toBe("ELECTRICITY");
    });

    it("should update thresholdState", async () => {
      mockAdminAuthSuccess();
      const updatePayload = { thresholdState: "DISABLED" };

      const response = await request(app)
        .put(`/api/thresholds/${createdThresholdId}`)
        .set("Authorization", authToken)
        .send(updatePayload)
        .expect(200);

      expect(response.body.thresholdState).toBe("DISABLED");
    });

    it("should update multiple fields", async () => {
      mockAdminAuthSuccess();
      const updatePayload = {
        value: 300,
        thresholdState: "DISABLED",
        utilityType: "GAS",
      };

      const response = await request(app)
        .put(`/api/thresholds/${createdThresholdId}`)
        .set("Authorization", authToken)
        .send(updatePayload)
        .expect(200);

      expect(response.body.value).toBe(300);
      expect(response.body.thresholdState).toBe("DISABLED");
      expect(response.body.utilityType).toBe("GAS");
    });

    it("should return 404 for non-existent threshold", async () => {
      mockAdminAuthSuccess();

      await request(app)
        .put("/api/thresholds/507f1f77bcf86cd799439011")
        .set("Authorization", authToken)
        .send({ value: 100 })
        .expect(404);
    });

    it("should return 403 when user is not admin", async () => {
      mockAdminAuthFailure();

      await request(app)
        .put(`/api/thresholds/${createdThresholdId}`)
        .set("Authorization", authToken)
        .send({ value: 100 })
        .expect(403);
    });

    it("should return 400 when no fields provided", async () => {
      mockAdminAuthSuccess();

      const response = await request(app)
        .put(`/api/thresholds/${createdThresholdId}`)
        .set("Authorization", authToken)
        .send({})
        .expect(400);

      expect(response.body.error).toBe("ValidationError");
    });

    it("should return 400 for invalid value", async () => {
      mockAdminAuthSuccess();

      await request(app)
        .put(`/api/thresholds/${createdThresholdId}`)
        .set("Authorization", authToken)
        .send({ value: -50 })
        .expect(400);
    });
  });

  describe("DELETE /api/thresholds/:id", () => {
    let createdThresholdId: string;

    beforeEach(async () => {
      mockAdminAuthSuccess();
      const createResponse = await request(app)
        .post("/api/thresholds")
        .set("Authorization", authToken)
        .send(thresholdFactory.validActual());

      createdThresholdId = createResponse.body.id;
    });

    it("should delete threshold successfully", async () => {
      mockAdminAuthSuccess();

      await request(app)
        .delete(`/api/thresholds/${createdThresholdId}`)
        .set("Authorization", authToken)
        .expect(204);

      mockAuthSuccess();
      await request(app)
        .get(`/api/thresholds/${createdThresholdId}`)
        .set("Authorization", authToken)
        .expect(404);
    });

    it("should return 403 when user is not admin", async () => {
      mockAdminAuthFailure();

      await request(app)
        .delete(`/api/thresholds/${createdThresholdId}`)
        .set("Authorization", authToken)
        .expect(403);
    });

    it("should return 401 without authentication", async () => {
      await request(app)
        .delete(`/api/thresholds/${createdThresholdId}`)
        .expect(401);
    });

    it("should handle deletion of non-existent threshold gracefully", async () => {
      mockAdminAuthSuccess();

      await request(app)
        .delete("/api/thresholds/507f1f77bcf86cd799439011")
        .set("Authorization", authToken)
        .expect(204);
    });
  });
});
