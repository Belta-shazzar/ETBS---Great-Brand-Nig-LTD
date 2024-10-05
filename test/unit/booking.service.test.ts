import "reflect-metadata";
import Container from "typedi";
import {
  PrismaClient,
  Booking,
  Event,
  BookingStatus,
  WaitList,
} from "@prisma/client";
import { BookingService } from "../../src/services/booking.service";
import { EventService } from "../../src/services/event.service";
import {
  BookTicketDto,
  BookingCancellationDto,
} from "../../src/dtos/booking.dto";
import { InitializeEventDto } from "../../src/dtos/event.dto";
import { EventStatusResponse } from "../../src/interfaces/event.interface";

let prisma: PrismaClient;
let bookingService: BookingService;
let eventService: EventService;

beforeAll(async () => {
  prisma = new PrismaClient();

  // Connect database
  await prisma.$connect();

  // Empty the event and booking tables
  // await prisma.booking.deleteMany();
  // await prisma.event.deleteMany();

  bookingService = Container.get(BookingService);
  eventService = Container.get(EventService);
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {});

describe("Booking Service", () => {
  describe("Book a ticket", () => {
    it("should add a user to waitlist due to unavailable ticket", async () => {
      const eventDto: InitializeEventDto = {
        name: "Tech Stars",
        totalTicket: 0,
        venue: "Ikeja",
        startAt: new Date("2024-10-15"),
        endAt: new Date("2024-10-18"),
      };
      const event = await eventService.initializeEvent(eventDto);

      const bookingDto: BookTicketDto = {
        eventId: event.id,
        name: "Agatha",
        email: "agatha@test.com",
        phoneNumber: "08000000000",
      };

      const bookingResponse: Booking | WaitList =
        await bookingService.bookATicket(bookingDto);

      expect(bookingResponse).toHaveProperty("id");
      expect(bookingResponse).toHaveProperty("userId");
      expect(bookingResponse).toHaveProperty("eventId");
      expect(bookingResponse).not.toContain("status");
    });
    it("should book an event ticket", async () => {
      const eventDto: InitializeEventDto = {
        name: "Tech Stars",
        totalTicket: 1,
        venue: "Ikeja",
        startAt: new Date("2024-10-15"),
        endAt: new Date("2024-10-18"),
      };
      const event = await eventService.initializeEvent(eventDto);

      const bookingDto: BookTicketDto = {
        eventId: event.id,
        name: "Agatha",
        email: "agatha@test.com",
        phoneNumber: "08000000000",
      };

      const bookedTicket: any = await bookingService.bookATicket(bookingDto);
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
      const eventDto: InitializeEventDto = {
        name: "Tech Stars",
        totalTicket: 1,
        venue: "Ikeja",
        startAt: new Date("2024-10-15"),
        endAt: new Date("2024-10-18"),
      };
      const event = await eventService.initializeEvent(eventDto);

      const firstBookingDto: BookTicketDto = {
        eventId: event.id,
        name: "Agatha",
        email: "agatha@test.com",
        phoneNumber: "08000000000",
      };

      const secondBookingDto: BookTicketDto = {
        eventId: event.id,
        name: "Simi",
        email: "simi@test.com",
        phoneNumber: "07000000000",
      };

      const bookedTicket = await bookingService.bookATicket(firstBookingDto); //book a ticket and set decrement available ticket
      await bookingService.bookATicket(secondBookingDto); //add this user to wait list to be reassigned the cancelled ticket

      const initialEventResponse: EventStatusResponse =
        await eventService.getEventStatus(event.id); // waitlist count should be one

      const cancellationDto: BookingCancellationDto = {
        bookingId: bookedTicket.id,
        reason: "I'm cancelling because of an emergency",
      };

      const cancelledBooking: Booking = await bookingService.cancelBooking(
        cancellationDto
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
      const eventDto: InitializeEventDto = {
        name: "Tech Stars",
        totalTicket: 1,
        venue: "Ikeja",
        startAt: new Date("2024-10-15"),
        endAt: new Date("2024-10-18"),
      };
      const event = await eventService.initializeEvent(eventDto);

      const bookingDto: BookTicketDto = {
        eventId: event.id,
        name: "Agatha",
        email: "agatha@test.com",
        phoneNumber: "08000000000",
      };

      const bookedTicket = await bookingService.bookATicket(bookingDto);

      const cancellationDto: BookingCancellationDto = {
        bookingId: bookedTicket.id,
        reason: "I'm cancelling because of an emergency",
      };

      const cancelledBooking: Booking = await bookingService.cancelBooking(
        cancellationDto
      );

      const updatedEvent: Event = await eventService.getEventById(
        bookedTicket.eventId
      );

      expect(cancelledBooking.status).toBe(BookingStatus.CANCELLED);
      expect(updatedEvent.availableTicket).toBe(event.availableTicket);
    });
  });
});
