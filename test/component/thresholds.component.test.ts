import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
	type ComponentTestContext,
	clearDatabase,
	composeAppForComponentTest,
	startMongo,
	stopMongo,
} from "./setup";

const ADMIN = {
	"X-User-Id": "admin-id",
	"X-User-Role": "ADMIN",
	"X-User-Username": "admin",
};

const HOUSEHOLD = {
	"X-User-Id": "user-1",
	"X-User-Role": "HOUSEHOLD",
	"X-User-Username": "testuser",
};

const UNKNOWN_ID = "99999999-9999-4999-8999-999999999999";

describe("Thresholds Component", () => {
	let ctx: ComponentTestContext;

	beforeAll(startMongo);
	afterAll(stopMongo);

	beforeEach(async () => {
		await clearDatabase();
		ctx = await composeAppForComponentTest();
	});

	describe("Feature: Admin configures custom thresholds", () => {
		describe("Scenario: Create threshold", () => {
			it("Given valid ACTUAL threshold data, When admin creates, Then returns 201", async () => {
				const res = await request(ctx.app)
					.post("/api/thresholds")
					.set(ADMIN)
					.send({
						name: "Electricity Limit",
						utilityType: "ELECTRICITY",
						value: 100,
						thresholdType: "ACTUAL",
					});

				expect(res.status).toBe(StatusCodes.CREATED);
				expect(res.body).toMatchObject({
					id: expect.any(String) as string,
					name: "Electricity Limit",
					utilityType: "ELECTRICITY",
					value: 100,
					thresholdType: "ACTUAL",
					thresholdState: "ENABLED",
				});
				expect(res.body.periodType).toBeUndefined();
			});

			it("Given valid HISTORICAL threshold with period, When admin creates, Then returns 201", async () => {
				const res = await request(ctx.app)
					.post("/api/thresholds")
					.set(ADMIN)
					.send({
						name: "Weekly Gas Cap",
						utilityType: "GAS",
						value: 200,
						thresholdType: "HISTORICAL",
						periodType: "ONE_WEEK",
					});

				expect(res.status).toBe(StatusCodes.CREATED);
				expect(res.body).toMatchObject({
					name: "Weekly Gas Cap",
					thresholdType: "HISTORICAL",
					periodType: "ONE_WEEK",
					thresholdState: "ENABLED",
				});
			});

			it("Given ACTUAL threshold with a period, When admin creates, Then returns 400", async () => {
				const res = await request(ctx.app)
					.post("/api/thresholds")
					.set(ADMIN)
					.send({
						name: "Bad Actual",
						utilityType: "WATER",
						value: 50,
						thresholdType: "ACTUAL",
						periodType: "ONE_DAY",
					});

				expect(res.status).toBe(StatusCodes.BAD_REQUEST);
				expect(res.body.code).toBe("VALIDATION_ERROR");
			});

			it("Given HISTORICAL threshold without period, When admin creates, Then returns 400", async () => {
				const res = await request(ctx.app)
					.post("/api/thresholds")
					.set(ADMIN)
					.send({
						name: "No Period Historical",
						utilityType: "ELECTRICITY",
						value: 150,
						thresholdType: "HISTORICAL",
					});

				expect(res.status).toBe(StatusCodes.BAD_REQUEST);
				expect(res.body.code).toBe("VALIDATION_ERROR");
			});

			it("Given duplicate name, When admin creates, Then returns 409", async () => {
				await request(ctx.app).post("/api/thresholds").set(ADMIN).send({
					name: "Unique Name",
					utilityType: "ELECTRICITY",
					value: 100,
					thresholdType: "ACTUAL",
				});

				const res = await request(ctx.app)
					.post("/api/thresholds")
					.set(ADMIN)
					.send({
						name: "Unique Name",
						utilityType: "WATER",
						value: 200,
						thresholdType: "ACTUAL",
					});

				expect(res.status).toBe(StatusCodes.CONFLICT);
				expect(res.body.code).toBe("CONFLICT");
			});

			it("Given non-admin user, When creates, Then returns 403", async () => {
				const res = await request(ctx.app)
					.post("/api/thresholds")
					.set(HOUSEHOLD)
					.send({
						name: "Test",
						utilityType: "ELECTRICITY",
						value: 100,
						thresholdType: "ACTUAL",
					});

				expect(res.status).toBe(StatusCodes.FORBIDDEN);
				expect(res.body.code).toBe("FORBIDDEN");
			});

			it("Given no auth headers, When creates, Then returns 401", async () => {
				const res = await request(ctx.app).post("/api/thresholds").send({
					name: "Test",
					utilityType: "ELECTRICITY",
					value: 100,
					thresholdType: "ACTUAL",
				});

				expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
			});

			it("Given negative value, When admin creates, Then returns 400", async () => {
				const res = await request(ctx.app)
					.post("/api/thresholds")
					.set(ADMIN)
					.send({
						name: "Test",
						utilityType: "ELECTRICITY",
						value: -10,
						thresholdType: "ACTUAL",
					});

				expect(res.status).toBe(StatusCodes.BAD_REQUEST);
			});
		});

		describe("Scenario: List thresholds", () => {
			it("Given existing thresholds, When listed, Then returns 200 with all", async () => {
				await request(ctx.app).post("/api/thresholds").set(ADMIN).send({
					name: "First",
					utilityType: "ELECTRICITY",
					value: 100,
					thresholdType: "ACTUAL",
				});
				await request(ctx.app).post("/api/thresholds").set(ADMIN).send({
					name: "Second",
					utilityType: "GAS",
					value: 200,
					thresholdType: "HISTORICAL",
					periodType: "ONE_WEEK",
				});

				const res = await request(ctx.app).get("/api/thresholds").set(ADMIN);

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body).toHaveLength(2);
				expect(res.body[0].name).toBe("Second");
				expect(res.body[1].name).toBe("First");
			});

			it("Given no thresholds, When listed, Then returns 200 with empty array", async () => {
				const res = await request(ctx.app).get("/api/thresholds").set(ADMIN);

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body).toEqual([]);
			});

			it("Given filter by utility type, When listed, Then returns filtered results", async () => {
				await request(ctx.app).post("/api/thresholds").set(ADMIN).send({
					name: "Elec Threshold",
					utilityType: "ELECTRICITY",
					value: 100,
					thresholdType: "ACTUAL",
				});
				await request(ctx.app).post("/api/thresholds").set(ADMIN).send({
					name: "Water Threshold",
					utilityType: "WATER",
					value: 50,
					thresholdType: "ACTUAL",
				});

				const res = await request(ctx.app)
					.get("/api/thresholds?utilityType=ELECTRICITY")
					.set(ADMIN);

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body).toHaveLength(1);
				expect(res.body[0].name).toBe("Elec Threshold");
			});
		});

		describe("Scenario: Get threshold by ID", () => {
			it("Given existing threshold, When get by ID, Then returns 200", async () => {
				const createRes = await request(ctx.app)
					.post("/api/thresholds")
					.set(ADMIN)
					.send({
						name: "My Threshold",
						utilityType: "ELECTRICITY",
						value: 100,
						thresholdType: "ACTUAL",
					});
				const thresholdId = createRes.body.id as string;

				const res = await request(ctx.app)
					.get(`/api/thresholds/${thresholdId}`)
					.set(ADMIN);

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body).toMatchObject({
					id: thresholdId,
					name: "My Threshold",
				});
			});

			it("Given unknown ID, When get by ID, Then returns 404", async () => {
				const res = await request(ctx.app)
					.get(`/api/thresholds/${UNKNOWN_ID}`)
					.set(ADMIN);

				expect(res.status).toBe(StatusCodes.NOT_FOUND);
				expect(res.body.code).toBe("RESOURCE_NOT_FOUND");
			});
		});

		describe("Scenario: Edit threshold", () => {
			it("Given existing threshold, When admin updates name, Then returns 200", async () => {
				const createRes = await request(ctx.app)
					.post("/api/thresholds")
					.set(ADMIN)
					.send({
						name: "Old Name",
						utilityType: "ELECTRICITY",
						value: 100,
						thresholdType: "ACTUAL",
					});
				const thresholdId = createRes.body.id as string;

				const res = await request(ctx.app)
					.put(`/api/thresholds/${thresholdId}`)
					.set(ADMIN)
					.send({ name: "New Name" });

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body.name).toBe("New Name");
				expect(res.body.value).toBe(100);
			});

			it("Given existing threshold, When admin updates value, Then returns 200", async () => {
				const createRes = await request(ctx.app)
					.post("/api/thresholds")
					.set(ADMIN)
					.send({
						name: "Test",
						utilityType: "ELECTRICITY",
						value: 100,
						thresholdType: "ACTUAL",
					});
				const thresholdId = createRes.body.id as string;

				const res = await request(ctx.app)
					.put(`/api/thresholds/${thresholdId}`)
					.set(ADMIN)
					.send({ value: 200 });

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body.value).toBe(200);
			});

			it("Given update to duplicate name, When admin updates, Then returns 409", async () => {
				await request(ctx.app).post("/api/thresholds").set(ADMIN).send({
					name: "Existing",
					utilityType: "ELECTRICITY",
					value: 100,
					thresholdType: "ACTUAL",
				});
				const createRes = await request(ctx.app)
					.post("/api/thresholds")
					.set(ADMIN)
					.send({
						name: "Other",
						utilityType: "WATER",
						value: 50,
						thresholdType: "ACTUAL",
					});
				const thresholdId = createRes.body.id as string;

				const res = await request(ctx.app)
					.put(`/api/thresholds/${thresholdId}`)
					.set(ADMIN)
					.send({ name: "Existing" });

				expect(res.status).toBe(StatusCodes.CONFLICT);
				expect(res.body.code).toBe("CONFLICT");
			});

			it("Given unknown ID, When admin updates, Then returns 404", async () => {
				const res = await request(ctx.app)
					.put(`/api/thresholds/${UNKNOWN_ID}`)
					.set(ADMIN)
					.send({ name: "New Name" });

				expect(res.status).toBe(StatusCodes.NOT_FOUND);
				expect(res.body.code).toBe("RESOURCE_NOT_FOUND");
			});

			it("Given non-admin user, When updates, Then returns 403", async () => {
				const res = await request(ctx.app)
					.put(`/api/thresholds/${UNKNOWN_ID}`)
					.set(HOUSEHOLD)
					.send({ name: "New Name" });

				expect(res.status).toBe(StatusCodes.FORBIDDEN);
			});
		});

		describe("Scenario: Disable threshold", () => {
			it("Given enabled threshold, When admin disables, Then returns 200 with DISABLED state", async () => {
				const createRes = await request(ctx.app)
					.post("/api/thresholds")
					.set(ADMIN)
					.send({
						name: "To Disable",
						utilityType: "ELECTRICITY",
						value: 100,
						thresholdType: "ACTUAL",
					});
				const thresholdId = createRes.body.id as string;

				const res = await request(ctx.app)
					.put(`/api/thresholds/${thresholdId}`)
					.set(ADMIN)
					.send({ thresholdState: "DISABLED" });

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body.thresholdState).toBe("DISABLED");
			});

			it("Given disabled threshold, When admin re-enables, Then returns 200 with ENABLED state", async () => {
				const createRes = await request(ctx.app)
					.post("/api/thresholds")
					.set(ADMIN)
					.send({
						name: "To Toggle",
						utilityType: "ELECTRICITY",
						value: 100,
						thresholdType: "ACTUAL",
					});
				const thresholdId = createRes.body.id as string;

				await request(ctx.app)
					.put(`/api/thresholds/${thresholdId}`)
					.set(ADMIN)
					.send({ thresholdState: "DISABLED" });

				const res = await request(ctx.app)
					.put(`/api/thresholds/${thresholdId}`)
					.set(ADMIN)
					.send({ thresholdState: "ENABLED" });

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body.thresholdState).toBe("ENABLED");
			});
		});

		describe("Scenario: Delete threshold", () => {
			it("Given existing threshold, When admin deletes, Then returns 204", async () => {
				const createRes = await request(ctx.app)
					.post("/api/thresholds")
					.set(ADMIN)
					.send({
						name: "To Delete",
						utilityType: "ELECTRICITY",
						value: 100,
						thresholdType: "ACTUAL",
					});
				const thresholdId = createRes.body.id as string;

				const res = await request(ctx.app)
					.delete(`/api/thresholds/${thresholdId}`)
					.set(ADMIN);

				expect(res.status).toBe(StatusCodes.NO_CONTENT);

				const getRes = await request(ctx.app)
					.get(`/api/thresholds/${thresholdId}`)
					.set(ADMIN);

				expect(getRes.status).toBe(StatusCodes.NOT_FOUND);
			});

			it("Given unknown ID, When admin deletes, Then returns 404", async () => {
				const res = await request(ctx.app)
					.delete(`/api/thresholds/${UNKNOWN_ID}`)
					.set(ADMIN);

				expect(res.status).toBe(StatusCodes.NOT_FOUND);
				expect(res.body.code).toBe("RESOURCE_NOT_FOUND");
			});

			it("Given non-admin user, When deletes, Then returns 403", async () => {
				const res = await request(ctx.app)
					.delete(`/api/thresholds/${UNKNOWN_ID}`)
					.set(HOUSEHOLD);

				expect(res.status).toBe(StatusCodes.FORBIDDEN);
			});
		});
	});

	describe("Feature: Health check", () => {
		it("When health check, Then returns 200 with status ok", async () => {
			const res = await request(ctx.app).get("/health");

			expect(res.status).toBe(StatusCodes.OK);
			expect(res.body.status).toBe("ok");
		});
	});
});
