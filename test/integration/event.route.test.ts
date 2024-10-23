import request from "supertest";
import { Event } from "@prisma/client";
import { App } from "../../src/app";
import { EventRoute } from "../../src/routes/event.route";
import prisma from "../../src/config/prisma";
import { AuthRoute } from "../../src/routes/auth.route";
import { faker } from "@faker-js/faker";
import { SignUpDto } from "../../src/dtos/auth.dto";
import { generateUUID } from "../util";

describe("Event integration test", () => {
  afterAll(async () => {
    //   Clean up database after test
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    await prisma.$disconnect();
  });

  const eventRoute: EventRoute = new EventRoute();
  const authRoute: AuthRoute = new AuthRoute();
  
  const app: App = new App([eventRoute, authRoute]);

  let authToken: string;
  let event: Event;

  describe("[POST] /events/initialize", () => {
    const eventData = {
      name: "Test Event",
      totalTicket: 1,
      venue: "Test event venue",
      startAt: "2026-10-15T14:30:00Z",
      endAt: "2026-10-18T14:30:00Z",
    };
    it("should return an error if invalid data is passed", async () => {
      const signUpDto: SignUpDto = {
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        email: faker.internet.email(),
        phoneNumber: faker.phone.number(),
        password: "password",
      };

      const signUpResponse = await request(app.getServer())
        .post(`${authRoute.path}/sign-up`)
        .send(signUpDto);

      authToken = signUpResponse.body.data.token;

      const invalidEventDataconst = {
        ...eventData,
        totalTicket: 0,
      };

      const response = await request(app.getServer())
        .post(`${eventRoute.path}/initialize`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidEventDataconst);

      expect(response.status).toBe(400);
    });

    it("should return a 201", async () => {
      const response = await request(app.getServer())
        .post(`${eventRoute.path}/initialize`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(eventData);

      event = response.body.data;

      expect(response.status).toBe(201);
    });
  });
  describe("[GET] /events/status", () => {
    it("should return a 404 if id is not found", async () => {
      const invalidId = generateUUID();
      const response = await request(app.getServer()).get(
        `${eventRoute.path}/status/${invalidId}`
      );

      expect(response.status).toBe(404);
    });
    it("should return a 200", async () => {
      const response = await request(app.getServer()).get(
        `${eventRoute.path}/status/${event.id}`
      );

      expect(response.status).toBe(200);
    });
  });
});
