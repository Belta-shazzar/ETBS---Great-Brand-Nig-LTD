import { DeepMockProxy, mock, mockDeep, MockProxy } from "jest-mock-extended";
import {
  User,
  Event,
  PrismaClient,
  Booking,
  BookingStatus,
  WaitList,
} from "@prisma/client";
import { EventStatus } from "@prisma/client";
import dayjs from "dayjs";
import { BookingService } from "../../src/services/booking.service";
import { EventService } from "../../src/services/event.service";
import { WaitListService } from "../../src/services/waitList.service";
import { CancelledBookingService } from "../../src/services/cancelledBooking.service";
import { generateUUID } from "../util";
import { faker } from "@faker-js/faker";
import prisma from "../../src/config/prisma";
import { UpdateEventOption } from "../../src/enum/event.enum";
import { HttpException } from "../../src/exceptions/http.exception";
import { BookingCancellationDto } from "../../src/dtos/booking.dto";

// Mock prisma config module
jest.mock("../../src/config/prisma.ts", () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

describe("BookingService unit test", () => {
  // Mocked prisma client
  const mockedPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

  let bookingService: BookingService;

  // Mocked dependencies
  let eventService: MockProxy<EventService>;
  let waitListService: MockProxy<WaitListService>;
  let cancelBookingService: MockProxy<CancelledBookingService>;

  // Mocked user details
  const userId: string = generateUUID();
  const userName: string = `${faker.person.firstName()} ${faker.person.lastName()}`;
  const email: string = faker.internet.email();
  const phoneNumber: string = faker.phone.number();

  const mockUser: User = {
    id: userId,
    name: userName,
    email,
    phoneNumber,
    password: "hashedPassword",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mocked event details
  const eventId: string = generateUUID();
  const eventName: string = "Test event";
  const venue: string = "event_venue";
  const totalTicket: number = 1;
  const availableTicket: number = 1;
  const startAt: Date = new Date("2026-10-15T14:30:00.000Z");
  const endAt: Date = new Date("2026-10-18T14:30:00.000Z");

  const mockEvent: Event = {
    id: eventId,
    userId,
    name: eventName,
    venue,
    totalTicket,
    availableTicket,
    startAt,
    endAt,
    status: EventStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  // Mocked booking details
  const bookingId: string = generateUUID();

  const mockConfirmedBookingResponse: Booking = {
    id: bookingId,
    userId,
    eventId,
    status: BookingStatus.CONFIRMED,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Instanciate mock dependencies
    eventService = mock<EventService>();
    waitListService = mock<WaitListService>();
    cancelBookingService = mock<CancelledBookingService>();

    bookingService = new BookingService(
      eventService,
      waitListService,
      cancelBookingService
    );
  });

  describe("create booking cases", () => {
    it("should successfully create a booking with transaction", async () => {
      // Mock transaction object
      const mockTransaction = {
        booking: {
          create: jest.fn().mockResolvedValue(mockConfirmedBookingResponse),
        },
      };

      const result = await bookingService.createBooking(
        mockEvent.id,
        mockUser.id,
        mockTransaction
      );

      // Verify the booking creation was called with correct parameters
      expect(mockTransaction.booking.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          eventId: mockEvent.id,
          status: BookingStatus.CONFIRMED,
        },
      });

      // Verify the returned booking matches the expected response
      expect(result).toEqual(mockConfirmedBookingResponse);
    });
  });

  describe("book a ticket cases", () => {
    it("should successfully book a ticket when tickets are available", async () => {
      const mockTransaction = {
        $queryRaw: jest.fn().mockResolvedValue([mockEvent]),
        booking: {
          create: jest.fn().mockResolvedValue(mockConfirmedBookingResponse),
        },
        event: {
          update: jest.fn().mockResolvedValue({
            ...mockEvent,
            availableTicket: availableTicket - 1,
          }),
        },
      };

      mockedPrisma.$transaction.mockImplementation((callback) =>
        callback(mockTransaction as any)
      );

      eventService.getEventInLockedMode.mockResolvedValue(mockEvent);

      jest
        .spyOn(bookingService, "createBooking")
        .mockResolvedValue(mockConfirmedBookingResponse);

      eventService.updateEventAvailableTicket.mockResolvedValue(undefined);

      // Execute bookATicket
      const result = await bookingService.bookATicket(eventId, mockUser);

      // Assert
      expect(eventService.getEventInLockedMode).toHaveBeenCalledWith(
        eventId,
        mockTransaction
      );
      expect(bookingService.createBooking).toHaveBeenCalledWith(
        eventId,
        userId,
        mockTransaction
      );
      expect(eventService.updateEventAvailableTicket).toHaveBeenCalledWith(
        eventId,
        UpdateEventOption.DECREMENT,
        mockTransaction
      );
      expect(waitListService.addToWaitList).not.toHaveBeenCalled();
      expect(result).toEqual(mockConfirmedBookingResponse);
    });

    it("should add to waitlist when no tickets are available", async () => {
      const mockEventWithExhaustedTickets: Event = {
        ...mockEvent,
        availableTicket: 0,
      };

      const mockWaitList: WaitList = {
        id: generateUUID(),
        userId,
        eventId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock transaction setup
      const mockTransaction = {
        $queryRaw: jest.fn().mockResolvedValue([mockEventWithExhaustedTickets]),
        waitList: {
          create: jest.fn().mockResolvedValue(mockWaitList),
        },
      };

      mockedPrisma.$transaction.mockImplementation((callback) =>
        callback(mockTransaction as any)
      );

      // Setup service mocks
      eventService.getEventInLockedMode.mockResolvedValue(
        mockEventWithExhaustedTickets
      );

      jest
        .spyOn(bookingService, "createBooking")
        .mockResolvedValue(mockConfirmedBookingResponse);

      waitListService.addToWaitList.mockResolvedValue(mockWaitList);

      // Execute bookATicket
      const result = await bookingService.bookATicket(eventId, mockUser);

      // Assert
      expect(eventService.getEventInLockedMode).toHaveBeenCalledWith(
        eventId,
        mockTransaction
      );
      expect(bookingService.createBooking).not.toHaveBeenCalled();
      expect(eventService.updateEventAvailableTicket).not.toHaveBeenCalled();
      expect(waitListService.addToWaitList).toHaveBeenCalledWith(
        eventId,
        userId,
        mockTransaction
      );
      expect(result).toEqual(mockWaitList);
    });

    it("should throw error for cancelled events", async () => {
      const cancelledEvent = { ...mockEvent, status: EventStatus.CANCELLED };

      const mockTransaction = {
        $queryRaw: jest.fn().mockResolvedValue([cancelledEvent]),
      };

      // Setup transaction mock
      mockedPrisma.$transaction.mockImplementation((callback) =>
        callback(mockTransaction as any)
      );

      eventService.getEventInLockedMode.mockResolvedValue(cancelledEvent);

      jest
        .spyOn(bookingService, "createBooking")
        .mockResolvedValue(mockConfirmedBookingResponse);

      // Execute & Assert
      await expect(
        bookingService.bookATicket(eventId, mockUser)
      ).rejects.toThrow(new HttpException(400, "Event date is past"));
      expect(bookingService.createBooking).not.toHaveBeenCalled();
      expect(eventService.updateEventAvailableTicket).not.toHaveBeenCalled();
      expect(waitListService.addToWaitList).not.toHaveBeenCalled();
    });

    it("should throw error for past events", async () => {
      const pastEvent = {
        ...mockEvent,
        endAt: dayjs().subtract(1, "day").toDate(),
      };

      const mockTransaction = {
        $queryRaw: jest.fn().mockResolvedValue([pastEvent]),
      };

      // Setup transaction mock
      mockedPrisma.$transaction.mockImplementation((callback) =>
        callback(mockTransaction as any)
      );

      eventService.getEventInLockedMode.mockResolvedValue(pastEvent);

      jest
        .spyOn(bookingService, "createBooking")
        .mockResolvedValue(mockConfirmedBookingResponse);

      // Execute & Assert
      await expect(
        bookingService.bookATicket(eventId, mockUser)
      ).rejects.toThrow(new HttpException(400, "Event date is past"));
      expect(bookingService.createBooking).not.toHaveBeenCalled();
      expect(eventService.updateEventAvailableTicket).not.toHaveBeenCalled();
      expect(waitListService.addToWaitList).not.toHaveBeenCalled();
    });
  });

  describe("cancel booking cases", () => {
    const bookingId: string = generateUUID();
    const mockBooking: Booking = {
      id: bookingId,
      userId,
      eventId,
      status: BookingStatus.CONFIRMED,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const cancellationDto: BookingCancellationDto = {
      bookingId,
      reason: "Test Reason",
    };
    it("should successfully cancel a ticket and update available tickets", async () => {
      // Mock transaction object
      const mockTransaction = {
        booking: {
          findUnique: jest.fn().mockResolvedValue(mockBooking),
          update: jest.fn().mockResolvedValue({
            ...mockBooking,
            status: BookingStatus.CANCELLED,
          }),
        },
        $queryRaw: jest.fn().mockResolvedValue([mockEvent]),
        event: {
          update: jest.fn().mockResolvedValue({
            ...mockEvent,
            availableTickets: mockEvent.availableTicket + 1,
          }),
        },
      };

      // Mock the initial booking check
      mockedPrisma.booking.findUnique.mockResolvedValue(mockBooking);

      // Mock transaction implementation
      mockedPrisma.$transaction.mockImplementation((callback) =>
        callback(mockTransaction as any)
      );

      cancelBookingService.createCancellationRecord.mockResolvedValue(
        undefined
      );

      waitListService.getOldestWaitListEntry.mockResolvedValue(null);

      // Mock service calls
      eventService.getEventInLockedMode.mockResolvedValue(mockEvent);
      eventService.updateEventAvailableTicket.mockResolvedValue(undefined);

      // Execute the function
      const result = await bookingService.cancelBooking(
        cancellationDto,
        mockUser
      );

      // Assertions
      expect(prisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: mockBooking.id, userId: userId },
      });

      expect(mockTransaction.booking.update).toHaveBeenCalledWith({
        where: {
          id: mockBooking.id,
          userId: mockBooking.userId,
        },
        data: { status: BookingStatus.CANCELLED },
      });

      expect(waitListService.getOldestWaitListEntry).toHaveBeenCalledWith(
        mockBooking.eventId
      );

      expect(eventService.getEventInLockedMode).toHaveBeenCalledWith(
        mockBooking.eventId,
        mockTransaction
      );

      expect(eventService.updateEventAvailableTicket).toHaveBeenCalledWith(
        mockBooking.eventId,
        UpdateEventOption.INCREMENT,
        mockTransaction
      );

      expect(result).toEqual({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });
    });

    it("should successfully cancel a booking and assign to waiting list user", async () => {
      const mockWaitListEntry: WaitList = {
        id: generateUUID(),
        userId,
        eventId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockedReassignedBooking: Booking = {
        ...mockBooking,
        id: generateUUID(),
      };

      const mockTransaction = {
        booking: {
          findUnique: jest.fn().mockResolvedValue(mockBooking),
          update: jest.fn().mockResolvedValue({
            ...mockBooking,
            status: BookingStatus.CANCELLED,
          }),
          create: jest.fn().mockResolvedValue(mockedReassignedBooking),
        },
      };

      mockedPrisma.booking.findUnique.mockResolvedValue(mockBooking);

      mockedPrisma.$transaction.mockImplementation((callback) =>
        callback(mockTransaction as any)
      );

      waitListService.getOldestWaitListEntry.mockResolvedValue(
        mockWaitListEntry
      );

      waitListService.deleteRecordFromList.mockResolvedValue(undefined);

      cancelBookingService.createCancellationRecord.mockResolvedValue(
        undefined
      );

      jest
        .spyOn(bookingService, "createBooking")
        .mockResolvedValue(mockedReassignedBooking);

      const result = await bookingService.cancelBooking(
        cancellationDto,
        mockUser
      );

      expect(prisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: mockBooking.id, userId: userId },
      });

      expect(waitListService.getOldestWaitListEntry).toHaveBeenCalledWith(
        mockBooking.eventId
      );

      expect(bookingService.createBooking).toHaveBeenCalledWith(
        mockBooking.eventId,
        mockWaitListEntry.userId,
        mockTransaction
      );

      expect(waitListService.deleteRecordFromList).toHaveBeenCalledWith(
        mockWaitListEntry.id,
        mockTransaction
      );

      expect(result).toEqual({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });
    });

    it("should throw 404 if booking is not found", async () => {
      mockedPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        bookingService.cancelBooking(cancellationDto, mockUser)
      ).rejects.toThrow(new HttpException(404, "Ticket not found"));
    });

    it("should throw 404 if booking is already cancelled", async () => {
      mockedPrisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      await expect(
        bookingService.cancelBooking(cancellationDto, mockUser)
      ).rejects.toThrow(new HttpException(404, "Ticket not found"));
    });

    it("should throw error if user tries to cancel someone else's booking", async () => {
      // Mock transaction setup
      const mockTransaction = {
        booking: {
          update: jest
            .fn()
            .mockRejectedValue(new HttpException(404, "Ticket not found")),
        },
      };

      mockedPrisma.booking.findUnique.mockResolvedValue(mockBooking);
      mockedPrisma.$transaction.mockImplementation((callback) =>
        callback(mockTransaction as any)
      );

      const differentUser = { ...mockUser, id: generateUUID() };

      await expect(
        bookingService.cancelBooking(cancellationDto, differentUser)
      ).rejects.toThrow(new HttpException(404, "Ticket not found"));
    });
  });
});
