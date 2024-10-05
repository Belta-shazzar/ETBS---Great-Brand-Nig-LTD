import request from "supertest";
import { App } from "../../src/app";
import { EventRoute } from "../../src/routes/event.route";
import { EventService } from "../../src/services/event.service";

let app: App;
let eventRoute: EventRoute;
let eventService: EventService;
beforeAll(() => {
  eventRoute = new EventRoute();
  app = new App([eventRoute]);
  eventService = new EventService();
});
afterAll(() => {});

describe("Event integration test", () => {
  describe("[POST] /events/initialize", () => {
    it("should return an error if invalid data is passed", async () => {
      const eventData = {
        name: "Father and Son",
        totalTicket: 0, //Total ticket must be greater than 0
        venue: "Ikate, Surulere, Lagos",
        startAt: "2024-10-15T14:30:00Z",
        endAt: "2024-10-18T14:30:00Z",
      };
      const response = request(app.getServer())
        .post(`${eventRoute.path}/initialize`)
        .send(eventData);
        
      return response.expect(400);
    });

    it("should return a 201", async () => {
      const eventData = {
        name: "Father and Son",
        totalTicket: 3, //Total ticket must be greater than 0
        venue: "Ikate, Surulere, Lagos",
        startAt: new Date("2024-10-15"),
        endAt: new Date("2024-10-18"),
      };
      return request(app.getServer())
        .post(`${eventRoute.path}/initialize`)
        .send(eventData)
        .expect(201);
    });
  });
  describe("[GET] /events/status", () => {
    it("should return a 404 if id is not found", async () => {
      const invalidId = "c2bd3333-c587-4f4e-83c8-c8c3ece7c042";
      return request(app.getServer())
        .get(`${eventRoute.path}/status/${invalidId}`)
        .expect(404);
    });
    it("should return a 200", async () => {
      const eventData = {
        name: "Father and Son",
        totalTicket: 3,
        venue: "Ikate, Surulere, Lagos",
        startAt: new Date("2024-10-15"),
        endAt: new Date("2024-10-18"),
      };
      const event = await eventService.initializeEvent(eventData);
      return request(app.getServer())
        .get(`${eventRoute.path}/status/${event.id}`)
        .expect(200);
    });
  });
});
