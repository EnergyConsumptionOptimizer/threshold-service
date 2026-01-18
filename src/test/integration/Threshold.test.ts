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
  mockAdminAuthSuccess,
  mockAuthSuccess,
} from "./mocks/authMocks";

describe("Threshold API Integration Tests", () => {
  let app: Express;
  const authToken = "valid-token-value";
  const authCookie = [`authToken=${authToken}`];

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
        .set("Cookie", authCookie)
        .send(payload)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: payload.name,
        utilityType: payload.utilityType,
        thresholdType: payload.thresholdType,
        value: payload.value,
        thresholdState: payload.thresholdState,
      });
      expect(response.body.periodType).toBeUndefined();
    });

    it("should return 400 for negative threshold value", async () => {
      mockAdminAuthSuccess();
      const payload = thresholdFactory.invalid.negativeValue();

      const response = await request(app)
        .post("/api/thresholds")
        .set("Cookie", authCookie)
        .send(payload)
        .expect(400);

      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(response.body.errors).toHaveProperty("value");
    });

    it("should return 400 for missing required fields", async () => {
      mockAdminAuthSuccess();
      const payload = thresholdFactory.invalid.missingRequiredFields();

      const response = await request(app)
        .post("/api/thresholds")
        .set("Cookie", authCookie)
        .send(payload)
        .expect(400);

      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(Object.keys(response.body.errors).length).toBeGreaterThan(0);
    });

    it("should return 409 when threshold name already exists", async () => {
      mockAdminAuthSuccess();
      const payload = thresholdFactory.validActual();

      // Primo inserimento
      await request(app)
        .post("/api/thresholds")
        .set("Cookie", authCookie)
        .send(payload);

      // Secondo inserimento (duplicato)
      const response = await request(app)
        .post("/api/thresholds")
        .set("Cookie", authCookie)
        .send(payload)
        .expect(409);

      expect(response.body.code).toBe("CONFLICT");
      expect(response.body.errors).toHaveProperty("name");
    });
  });

  describe("GET /api/thresholds/:id", () => {
    it("should return 404 for non-existent id", async () => {
      mockAuthSuccess();

      const response = await request(app)
        .get("/api/thresholds/507f1f77bcf86cd799439011")
        .set("Cookie", authCookie)
        .expect(404);

      expect(response.body.code).toBe("RESOURCE_NOT_FOUND");
    });
  });

  describe("POST /api/internal/thresholds/evaluations/forecast", () => {
    it("should return 400 for negative value", async () => {
      mockAdminAuthSuccess();
      const response = await request(app)
        .post("/api/internal/thresholds/evaluations/forecast")
        .send({
          utilityType: "ELECTRICITY",
          aggregations: [{ periodType: "ONE_WEEK", value: -1 }],
        })
        .expect(400);

      expect(response.body.code).toBe("VALIDATION_ERROR");
    });
  });
});
