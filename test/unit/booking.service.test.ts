import "reflect-metadata";
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
import Container from "typedi";
import { EventStatusResponse } from "../../src/interfaces/event.interface";

let prisma: PrismaClient;
let bookingService: BookingService;
let eventService: EventService;
let event: Event;

beforeAll(async () => {
  prisma = new PrismaClient();

  // Connect database
  await prisma.$connect();

  // Empty the event and booking tables
  await prisma.booking.deleteMany();
  await prisma.event.deleteMany();

  bookingService = Container.get(BookingService);
  eventService = Container.get(EventService);
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  const eventDto: InitializeEventDto = {
    name: "Tech Stars",
    totalTickets: 30,
    venue: "Ikeja",
    startAt: new Date("2024-10-15"),
    endAt: new Date("2024-10-18"),
  };
  event = await eventService.initializeEvent(eventDto);
});

describe("Booking Service", () => {
  const bookingDto: BookTicketDto = {
    eventId: event!.id,
    name: "Agatha",
    email: "agatha@test.com",
    phoneNumber: "08000000000",
  };

  describe("Book a ticket", () => {
    it("should add a user to waitlist due to unavailable ticket", async () => {
      const unavailableTicketEventDto: InitializeEventDto = {
        name: "Tech Stars",
        totalTickets: 0,
        venue: "Ikeja",
        startAt: new Date("2024-10-15"),
        endAt: new Date("2024-10-18"),
      };
      event = await eventService.initializeEvent(unavailableTicketEventDto);
      const bookingResponse: Booking | WaitList =
        await bookingService.bookATicket(bookingDto);

      expect(bookingResponse).toHaveProperty("id");
      expect(bookingResponse).toHaveProperty("userId");
      expect(bookingResponse).toHaveProperty("eventId");
      expect(bookingResponse).not.toHaveProperty("status");
    });
    it("should book an event ticket", async () => {
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
      const oneAvailableTicketEventDto: InitializeEventDto = {
        name: "Tech Stars",
        totalTickets: 1,
        venue: "Ikeja",
        startAt: new Date("2024-10-15"),
        endAt: new Date("2024-10-18"),
      };

      event = await eventService.initializeEvent(oneAvailableTicketEventDto);
      const initialEventResponse: EventStatusResponse = await eventService.getEventStatus(
        event.id
      );

      const nexUserBookingDto: BookTicketDto = {
        eventId: event.id,
        name: "Simi",
        email: "simi@test.com",
        phoneNumber: "07000000000",
      };

      // After this booking, the available ticket is set to 0 and the next user would be added to the wait list
      const bookedTicket = await bookingService.bookATicket(bookingDto);
      await bookingService.bookATicket(
        nexUserBookingDto
      );

      const cancellationDto: BookingCancellationDto = {
        bookingId: bookedTicket.id,
        reason: "I'm cancelling because of an emergency",
      };
      const cancelledBooking: Booking = await bookingService.cancelBooking(
        cancellationDto
      );

      const finalEventResponse: EventStatusResponse = await eventService.getEventStatus(
        bookedTicket.eventId
      );

      expect(cancelledBooking.status).toBe(BookingStatus.CANCELLED);
      expect(initialEventResponse.waitListCount).toBeLessThan(
        finalEventResponse.waitListCount
      );
    });
    it("should cancel a booking and increment the event's available ticket", async () => {
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
      expect(updatedEvent.availableTicket).toBeGreaterThan(
        event.availableTicket
      );
    });
  });
});
