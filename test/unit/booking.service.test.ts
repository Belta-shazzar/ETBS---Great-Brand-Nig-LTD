import { PrismaClient, Booking, Event, BookingStatus } from "@prisma/client";
import { BookingService } from "../../src/services/booking.service";
import { EventService } from "../../src/services/event.service";
import { UserService } from "../../src/services/user.service";
import { BookingCancellationDto } from "../../src/dtos/booking.dto";
import { InitializeEventDto } from "../../src/dtos/event.dto";
import { SignUpDto } from "../../src/dtos/auth.dto";
import { EventStatusResponse } from "../../src/interfaces/event.interface";

let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient();
  await prisma.$connect();
});

beforeEach(async () => {
  await prisma.cancelledBooking.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.waitList.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.cancelledBooking.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.waitList.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  
  await prisma.$disconnect();
});

describe("Booking Service", () => {
  describe("Book a ticket", () => {
    it("should add a user to waitlist due to unavailable ticket", async () => {
      const eventService = new EventService();
      const userService = new UserService();
      const bookingService = new BookingService();

      const eventDto: InitializeEventDto = {
        name: "Tech Stars",
        totalTicket: 0,
        venue: "Ikeja",
        startAt: new Date("2024-10-15"),
        endAt: new Date("2024-10-18"),
      };
      const event = await eventService.initializeEvent(eventDto);

      const signUpDto: SignUpDto = {
        name: "Agatha",
        email: "agatha@test.com",
        password: "password",
        phoneNumber: "08000000000",
      };
      const user = await userService.createUser(signUpDto);

      const bookingResponse: any = await bookingService.bookATicket(
        event.id,
        user.id
      );

      expect(bookingResponse).toHaveProperty("id");
      expect(bookingResponse).toHaveProperty("userId");
      expect(bookingResponse).toHaveProperty("eventId");
      expect(bookingResponse).not.toContain("status");
    });
    it("should book an event ticket", async () => {
      const eventService = new EventService();
      const userService = new UserService();
      const bookingService = new BookingService();

      const eventDto: InitializeEventDto = {
        name: "Tech Stars",
        totalTicket: 1,
        venue: "Ikeja",
        startAt: new Date("2024-10-15"),
        endAt: new Date("2024-10-18"),
      };
      const event = await eventService.initializeEvent(eventDto);

      const signUpDto: SignUpDto = {
        name: "Agatha",
        email: "agatha@test.com",
        password: "password",
        phoneNumber: "08000000000",
      };
      const user = await userService.createUser(signUpDto);

      const bookedTicket: any = await bookingService.bookATicket(
        event.id,
        user.id
      );

      const updatedEvent: Event = await eventService.getEventById(
        bookedTicket.eventId
      );

      expect(bookedTicket).toHaveProperty("id");
      expect(bookedTicket).toHaveProperty("userId");
      expect(bookedTicket).toHaveProperty("eventId");
      expect(bookedTicket.status).toBe(BookingStatus.CONFIRMED);
      expect(updatedEvent.availableTicket).toBeLessThan(event.availableTicket);
    });
  });

  describe("Cancel a booked ticket", () => {
    it("should cancel a booking and assign it to the oldest user on the event's wait list", async () => {
      const eventService = new EventService();
      const userService = new UserService();
      const bookingService = new BookingService();

      const eventDto: InitializeEventDto = {
        name: "Tech Stars",
        totalTicket: 1,
        venue: "Ikeja",
        startAt: new Date("2024-10-15"),
        endAt: new Date("2024-10-18"),
      };
      const event = await eventService.initializeEvent(eventDto);

      const firstUser: SignUpDto = {
        name: "Agatha",
        email: "agatha@test.com",
        password: "password",
        phoneNumber: "08000000000",
      };

      const secondUser: SignUpDto = {
        name: "Simi",
        email: "simi@test.com",
        password: "password",
        phoneNumber: "07000000000",
      };
      const user1 = await userService.createUser(firstUser);
      const user2 = await userService.createUser(secondUser);

      const bookedTicket = await bookingService.bookATicket(event.id, user1.id); //book a ticket and set decrement available ticket
      await bookingService.bookATicket(event.id, user2.id); //add this user to wait list to be reassigned the cancelled ticket

      const initialEventResponse: EventStatusResponse =
        await eventService.getEventStatus(event.id); // waitlist count should be one

      const cancellationDto: BookingCancellationDto = {
        bookingId: bookedTicket.id,
        reason: "I'm cancelling because of an emergency",
      };

      const cancelledBooking: Booking = await bookingService.cancelBooking(
        cancellationDto,
        user1.id
      );

      const finalEventResponse: EventStatusResponse =
        await eventService.getEventStatus(bookedTicket.eventId); // waitlist count should be 0

      expect(cancelledBooking.status).toBe(BookingStatus.CANCELLED);
      expect(initialEventResponse.event.availableTicket).toBe(
        finalEventResponse.event.availableTicket
      );
      expect(initialEventResponse.waitListCount).toBeGreaterThan(
        finalEventResponse.waitListCount
      );
    });
    it("should cancel a booking and increment the event's available ticket", async () => {
      const eventService = new EventService();
      const userService = new UserService();
      const bookingService = new BookingService();

      const eventDto: InitializeEventDto = {
        name: "Tech Stars",
        totalTicket: 1,
        venue: "Ikeja",
        startAt: new Date("2024-10-15"),
        endAt: new Date("2024-10-18"),
      };
      const event = await eventService.initializeEvent(eventDto);

      const signUpDto: SignUpDto = {
        name: "Agatha",
        email: "agatha@test.com",
        password: "password",
        phoneNumber: "08000000000",
      };
      const user = await userService.createUser(signUpDto);

      const bookedTicket = await bookingService.bookATicket(event.id, user.id);

      const cancellationDto: BookingCancellationDto = {
        bookingId: bookedTicket.id,
        reason: "I'm cancelling because of an emergency",
      };

      const cancelledBooking: Booking = await bookingService.cancelBooking(
        cancellationDto,
        user.id
      );

      const updatedEvent: Event = await eventService.getEventById(
        bookedTicket.eventId
      );

      expect(cancelledBooking.status).toBe(BookingStatus.CANCELLED);
      expect(updatedEvent.availableTicket).toBe(event.availableTicket);
    });
  });
});
