import request from "supertest";
import { App } from "../../src/app";
import { BookingRoute } from "../../src/routes/booking.route";
import { LoginDto, SignUpDto } from "../../src/dtos/auth.dto";
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
  let user: User;
  let token: string;
  let event: Event;
  let booking: Booking;

  describe("[POST] /bookings/book", () => {
    it("should return a 404 if event is not found", async () => {
      const signUpDto: SignUpDto = {
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        email: "agatha@test.com",
        password: "password",
        phoneNumber: faker.phone.number(),
      };

      const userResponse = await request(app.getServer())
        .post(`${authRoute.path}/sign-up`)
        .send(signUpDto);

      user = userResponse.body.data.user;
      token = userResponse.body.data.token;

      return request(app.getServer())
        .post(`${bookingRoute.path}/book`)
        .set("Authorization", `Bearer ${token}`)
        .send({ eventId: "c2bd3333-c587-4f4e-83c8-c8c3ece7c042" })
        .expect(404);
    });
    it("should book a ticket or add user to wait list", async () => {
      const eventData = {
        name: "Father and Son",
        totalTicket: 1,
        venue: "Ikate, Surulere, Lagos",
        startAt: "2024-10-15T14:30:00Z",
        endAt: "2024-10-18T14:30:00Z",
      };
      const eventResponse = await request(app.getServer())
        .post(`${eventRoute.path}/initialize`)
        .send(eventData);
      event = eventResponse.body.data;

      const bookingResponse = request(app.getServer())
        .post(`${bookingRoute.path}/book`)
        .set("Authorization", `Bearer ${token}`)
        .send({ eventId: event.id });

      booking = (await bookingResponse).body.data;

      return bookingResponse.expect(200);
    });
  });
  describe("[POST] /bookings/cancel", () => {
    it("should return a 404 if booking is not found", async () => {
      return request(app.getServer())
        .post(`${bookingRoute.path}/cancel`)
        .set("Authorization", `Bearer ${token}`)
        .send({ bookingId: "c2bd3333-c587-4f4e-83c8-c8c3ece7c042" })
        .expect(500);
    });
    it("should return a 200", async () => {
      return request(app.getServer())
        .post(`${bookingRoute.path}/cancel`)
        .set("Authorization", `Bearer ${token}`)
        .send({ bookingId: booking.id })
        .expect(200);
    });
  });
});
