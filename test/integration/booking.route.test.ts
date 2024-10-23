import request from "supertest";
import { App } from "../../src/app";
import { BookingRoute } from "../../src/routes/booking.route";
import { SignUpDto } from "../../src/dtos/auth.dto";
import { AuthRoute } from "../../src/routes/auth.route";
import { EventRoute } from "../../src/routes/event.route";
import { faker } from "@faker-js/faker";
import prisma from "../../src/config/prisma";
import { generateUUID } from "../util";

describe("Booking integration test", () => {
  const authRoute: AuthRoute = new AuthRoute();
  const eventRoute: EventRoute = new EventRoute();
  const bookingRoute: BookingRoute = new BookingRoute();

  const app: App = new App([bookingRoute, authRoute, eventRoute]);

  let globalAuthToken: string;

  beforeAll(async () => {
    // create global user
    const globalUserDto: SignUpDto = {
      name: `${faker.person.firstName()} ${faker.person.lastName()}`,
      email: "testuser1@mail.com",
      phoneNumber: faker.phone.number(),
      password: "password",
    };

    const signUpResponse = await request(app.getServer())
      .post(`${authRoute.path}/sign-up`)
      .send(globalUserDto);

    globalAuthToken = signUpResponse.body.data.token;
  });

  afterAll(async () => {
    //   Clear database before test
    await prisma.cancelledBooking.deleteMany();
    await prisma.waitList.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    await prisma.$disconnect();
  });

  describe("[POST] /bookings/book", () => {
    it("should successfully book a ticket", async () => {
      // Create global event
      const eventDto = {
        name: "Test Event",
        totalTicket: 1,
        venue: "Test Event Venue",
        startAt: "2026-10-15T14:30:00Z",
        endAt: "2026-10-18T14:30:00Z",
      };

      const eventResponse = await request(app.getServer())
        .post(`${eventRoute.path}/initialize`)
        .set("Authorization", `Bearer ${globalAuthToken}`)
        .send(eventDto);

      const event = eventResponse.body.data;

      const response = await request(app.getServer())
        .post(`${bookingRoute.path}/book`)
        .set("Authorization", `Bearer ${globalAuthToken}`)
        .send({ eventId: event.id });

      const confirmationResponse = await request(app.getServer()).get(
        `${eventRoute.path}/status/${event.id}`
      );

      const eventStatus = confirmationResponse.body.data;

      expect(eventStatus.event.availableTicket).toEqual(0);
      expect(eventStatus.waitListCount).toEqual(0);

      expect(response.status).toBe(200);
    });

    it("should successfully add a user to wait list", async () => {
      const eventDto = {
        name: "Test Event",
        totalTicket: 1,
        venue: "Test Event Venue",
        startAt: "2026-10-15T14:30:00Z",
        endAt: "2026-10-18T14:30:00Z",
      };

      const eventResponse = await request(app.getServer())
        .post(`${eventRoute.path}/initialize`)
        .set("Authorization", `Bearer ${globalAuthToken}`)
        .send(eventDto);

      const event = eventResponse.body.data;

      await request(app.getServer())
        .post(`${bookingRoute.path}/book`)
        .set("Authorization", `Bearer ${globalAuthToken}`)
        .send({ eventId: event.id });

      const response = await request(app.getServer())
        .post(`${bookingRoute.path}/book`)
        .set("Authorization", `Bearer ${globalAuthToken}`)
        .send({ eventId: event.id });

      const confirmationResponse = await request(app.getServer()).get(
        `${eventRoute.path}/status/${event.id}`
      );

      const eventStatus = confirmationResponse.body.data;

      expect(response.status).toBe(200);
      expect(eventStatus.event.availableTicket).toEqual(0);
      expect(eventStatus.waitListCount).toEqual(1);
    });

    it("should return a 404 if event is not found", async () => {
      const response = await request(app.getServer())
        .post(`${bookingRoute.path}/book`)
        .set("Authorization", `Bearer ${globalAuthToken}`)
        .send({ eventId: generateUUID() });

      expect(response.status).toBe(404);
    });

    it("should handle race conditioning", async () => {
      const user1Response = await request(app.getServer())
        .post(`${authRoute.path}/sign-up`)
        .send({
          name: `${faker.person.firstName()} ${faker.person.lastName()}`,
          email: "racetestuser1@mail.com",
          phoneNumber: faker.phone.number(),
          password: "password",
        });

      const user2Response = await request(app.getServer())
        .post(`${authRoute.path}/sign-up`)
        .send({
          name: `${faker.person.firstName()} ${faker.person.lastName()}`,
          email: "racetestuser2@mail.com",
          phoneNumber: faker.phone.number(),
          password: "password",
        });

      const eventDto = {
        name: "Race Condition Event Test",
        totalTicket: 1,
        venue: "Race Test Event Venue",
        startAt: "2026-10-15T14:30:00Z",
        endAt: "2026-10-18T14:30:00Z",
      };

      const eventResponse = await request(app.getServer())
        .post(`${eventRoute.path}/initialize`)
        .set("Authorization", `Bearer ${globalAuthToken}`)
        .send(eventDto);

      const event = eventResponse.body.data;

      // Make two concurrent requests
      const requests = [
        // request by user1
        request(app.getServer())
          .post(`${bookingRoute.path}/book`)
          .set("Authorization", `Bearer ${user1Response.body.data.token}`)
          .send({ eventId: event.id }),

        // request by user2
        request(app.getServer())
          .post(`${bookingRoute.path}/book`)
          .set("Authorization", `Bearer ${user2Response.body.data.token}`)
          .send({ eventId: event.id }),
      ];
      await Promise.allSettled(requests);

      const checkEventStatus = await request(app.getServer()).get(
        `${eventRoute.path}/status/${event.id}`
      );

      const eventStatus = checkEventStatus.body.data;

      expect(eventStatus.event.availableTicket).toEqual(0);
      expect(eventStatus.waitListCount).toEqual(1);
    });
  });
  describe("[POST] /bookings/cancel", () => {
    it("should cancel a booking and update event available ticket", async () => {
      const eventDto = {
        name: "Test Event",
        totalTicket: 1,
        venue: "Test Event Venue",
        startAt: "2026-10-15T14:30:00Z",
        endAt: "2026-10-18T14:30:00Z",
      };

      const eventResponse = await request(app.getServer())
        .post(`${eventRoute.path}/initialize`)
        .set("Authorization", `Bearer ${globalAuthToken}`)
        .send(eventDto);

      const event = eventResponse.body.data;

      const booking = await request(app.getServer())
        .post(`${bookingRoute.path}/book`)
        .set("Authorization", `Bearer ${globalAuthToken}`)
        .send({ eventId: event.id });

      const bookingId = booking.body.data.response.id;

      const eventBeforeCancellation = await request(app.getServer()).get(
        `${eventRoute.path}/status/${event.id}`
      );

      const response = await request(app.getServer())
        .post(`${bookingRoute.path}/cancel`)
        .set("Authorization", `Bearer ${globalAuthToken}`)
        .send({
          bookingId,
          reason: "An emergency",
        });

      const eventAfterCancellation = await request(app.getServer()).get(
        `${eventRoute.path}/status/${event.id}`
      );

      const eventStatusBeforeCancellation = eventBeforeCancellation.body.data;
      const eventStatusAfterCancellation = eventAfterCancellation.body.data;

      expect(response.status).toBe(200);
      expect(eventStatusBeforeCancellation.event.availableTicket).toEqual(0);
      expect(eventStatusBeforeCancellation.waitListCount).toEqual(0);
      expect(eventStatusAfterCancellation.event.availableTicket).toEqual(1);
      expect(eventStatusAfterCancellation.waitListCount).toEqual(0);
    });

    it("should cancel a booking and assign cancelled booking to the oldest entry on the waitlist", async () => {
      const localUserDto: SignUpDto = {
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        email: "testuser2@mail.com",
        phoneNumber: faker.phone.number(),
        password: "password",
      };
      const signUpResponse = await request(app.getServer())
        .post(`${authRoute.path}/sign-up`)
        .send(localUserDto);

      const token = signUpResponse.body.data.token;

      const eventDto = {
        name: "Test Event",
        totalTicket: 1,
        venue: "Test Event Venue",
        startAt: "2026-10-15T14:30:00Z",
        endAt: "2026-10-18T14:30:00Z",
      };

      const eventResponse = await request(app.getServer())
        .post(`${eventRoute.path}/initialize`)
        .set("Authorization", `Bearer ${globalAuthToken}`)
        .send(eventDto);

      const event = eventResponse.body.data;

      const booking = await request(app.getServer())
        .post(`${bookingRoute.path}/book`)
        .set("Authorization", `Bearer ${globalAuthToken}`)
        .send({ eventId: event.id });

      const bookingId = booking.body.data.response.id;

      await request(app.getServer())
        .post(`${bookingRoute.path}/book`)
        .set("Authorization", `Bearer ${token}`)
        .send({ eventId: event.id });

      const eventBeforeCancellation = await request(app.getServer()).get(
        `${eventRoute.path}/status/${event.id}`
      );

      const response = await request(app.getServer())
        .post(`${bookingRoute.path}/cancel`)
        .set("Authorization", `Bearer ${globalAuthToken}`)
        .send({
          bookingId,
          reason: "An emergency",
        });

      const eventAfterCancellation = await request(app.getServer()).get(
        `${eventRoute.path}/status/${event.id}`
      );

      const eventStatusBeforeCancellation = eventBeforeCancellation.body.data;
      const eventStatusAfterCancellation = eventAfterCancellation.body.data;

      expect(response.status).toBe(200);
      expect(eventStatusBeforeCancellation.event.availableTicket).toEqual(0);
      expect(eventStatusBeforeCancellation.waitListCount).toEqual(1);
      expect(eventStatusAfterCancellation.event.availableTicket).toEqual(0);
      expect(eventStatusAfterCancellation.waitListCount).toEqual(0);
    });
    it("should return a 404 if booking is not found", async () => {
      const response = await request(app.getServer())
        .post(`${bookingRoute.path}/cancel`)
        .set("Authorization", `Bearer ${globalAuthToken}`)
        .send({ bookingId: generateUUID() });

      expect(response.status).toBe(404);
    });
  });
});
