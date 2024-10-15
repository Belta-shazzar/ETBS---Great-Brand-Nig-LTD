import request from "supertest";
import { App } from "../../src/app";
import { BookingRoute } from "../../src/routes/booking.route";
import { SignUpDto } from "../../src/dtos/auth.dto";
import { Booking, Event, PrismaClient, User } from "@prisma/client";
import { AuthRoute } from "../../src/routes/auth.route";
import { EventRoute } from "../../src/routes/event.route";
import { faker } from "@faker-js/faker";

let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient();
  await prisma.$connect();
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

describe("Booking integration test", () => {
  let bookingRoute: BookingRoute = new BookingRoute();
  let authRoute: AuthRoute = new AuthRoute();
  let eventRoute: EventRoute = new EventRoute();
  let app: App = new App([bookingRoute, authRoute, eventRoute]);

  describe("[POST] /bookings/book", () => {
    let token: string;
    let event: Event;
    const signUpDto: SignUpDto = {
      name: `${faker.person.firstName()} ${faker.person.lastName()}`,
      email: faker.internet.email(),
      password: "password",
      phoneNumber: faker.phone.number(),
    };
    const eventData = {
      name: "Father and Son",
      totalTicket: 1,
      venue: "Ikate, Surulere, Lagos",
      startAt: "2026-10-15T14:30:00Z",
      endAt: "2026-10-18T14:30:00Z",
    };

    it("should return a 404 if event is not found", async () => {
      const userResponse = await request(app.getServer())
        .post(`${authRoute.path}/sign-up`)
        .send(signUpDto);

      token = userResponse.body.data.token;

      return request(app.getServer())
        .post(`${bookingRoute.path}/book`)
        .set("Authorization", `Bearer ${token}`)
        .send({ eventId: "c2bd3333-c587-4f4e-83c8-c8c3ece7c042" })
        .expect(404);
    });
    it("should book a ticket or add user to wait list", async () => {
      const eventResponse = await request(app.getServer())
        .post(`${eventRoute.path}/initialize`)
        .send(eventData);
      event = eventResponse.body.data;

      return request(app.getServer())
        .post(`${bookingRoute.path}/book`)
        .set("Authorization", `Bearer ${token}`)
        .send({ eventId: event.id })
        .expect(200);
    });
  });
  describe("[POST] /bookings/cancel", () => {
    let token: string;
    let event: Event;
    const signUpDto: SignUpDto = {
      name: `${faker.person.firstName()} ${faker.person.lastName()}`,
      email: faker.internet.email(),
      password: "password",
      phoneNumber: faker.phone.number(),
    };
    const eventData = {
      name: "Father and Son",
      totalTicket: 1,
      venue: "Ikate, Surulere, Lagos",
      startAt: "2026-10-15T14:30:00Z",
      endAt: "2026-10-18T14:30:00Z",
    };
    it("should return a 404 if booking is not found", async () => {
      const userResponse = await request(app.getServer())
        .post(`${authRoute.path}/sign-up`)
        .send(signUpDto);

      token = userResponse.body.data.token;

      return request(app.getServer())
        .post(`${bookingRoute.path}/cancel`)
        .set("Authorization", `Bearer ${token}`)
        .send({ bookingId: "c2bd3333-c587-4f4e-83c8-c8c3ece7c042" })
        .expect(404);
    });
    it("should return a 200", async () => {
      const eventResponse = await request(app.getServer())
        .post(`${eventRoute.path}/initialize`)
        .send(eventData);
      event = eventResponse.body.data;
      
      const thisBooking = await request(app.getServer())
        .post(`${bookingRoute.path}/book`)
        .set("Authorization", `Bearer ${token}`)
        .send({ eventId: event.id });

      return request(app.getServer())
        .post(`${bookingRoute.path}/cancel`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          bookingId: thisBooking.body.data.response.id,
          reason: "An emergency",
        })
        .expect(200);
    });
  });
});
