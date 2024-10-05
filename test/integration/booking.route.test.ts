import request from "supertest";
import { App } from "../../src/app";
import { BookingRoute } from "../../src/routes/booking.route";
import { BookingService } from "../../src/services/booking.service";
import { EventService } from "../../src/services/event.service";

let app: App;
let bookingRoute: BookingRoute;
let bookingService: BookingService;
let eventService: EventService;

beforeAll(() => {
  bookingRoute = new BookingRoute();
  app = new App([bookingRoute]);
  bookingService = new BookingService();
  eventService = new EventService();
});
afterAll(() => {});

describe("Booking integration test", () => {
  describe("[POST] /bookings/book", () => {
    it("should return a 404 if event is not found", async () => {
      const bookingData = {
        eventId: "c2bd3333-c587-4f4e-83c8-c8c3ece7c042",
        name: "Abel Josh",
        email: "josh@test.com",
        phoneNumber: "09038498320",
      };

      return request(app.getServer())
        .post(`${bookingRoute.path}/book`)
        .send(bookingData)
        .expect(404);
    });
    it("should return a 400 if event is end date is past", async () => {
      const eventData = {
        name: "Father and Son",
        totalTicket: 3,
        venue: "Ikate, Surulere, Lagos",
        startAt: new Date("2024-9-15"),
        endAt: new Date("2024-9-18"),
      };
      const event = await eventService.initializeEvent(eventData);

      const bookingData = {
        eventId: event.id,
        name: "Abel Josh",
        email: "josh@test.com",
        phoneNumber: "09038498320",
      };

      return request(app.getServer())
        .post(`${bookingRoute.path}/book`)
        .send(bookingData)
        .expect(400);
    });
    it("should book a ticket or add user to wait list", async () => {
      const eventData = {
        name: "Father and Son",
        totalTicket: 3,
        venue: "Ikate, Surulere, Lagos",
        startAt: new Date("2024-10-15"),
        endAt: new Date("2024-10-18"),
      };
      const event = await eventService.initializeEvent(eventData);

      const bookingData = {
        eventId: event.id,
        name: "Abel Josh",
        email: "josh@test.com",
        phoneNumber: "09038498320",
      };

      return request(app.getServer())
        .post(`${bookingRoute.path}/book`)
        .send(bookingData)
        .expect(200);
    });
  });
  describe("[POST] /bookings/cancel", () => {
    it("should return a 404 if booking is not found", async () => {
      return request(app.getServer())
        .post(`${bookingRoute.path}/cancel`)
        .send({ bookingId: "c2bd3333-c587-4f4e-83c8-c8c3ece7c042" })
        .expect(500);
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

      const bookingData = {
        eventId: event.id,
        name: "Abel Josh",
        email: "josh@test.com",
        phoneNumber: "09038498320",
      };
      const booking = await bookingService.bookATicket(bookingData);
      return request(app.getServer())
        .post(`${bookingRoute.path}/cancel`)
        .send({ bookingId: booking.id })
        .expect(200);
    });
  });
});
