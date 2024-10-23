// import { DeepMockProxy, mock, mockDeep, MockProxy } from "jest-mock-extended";
// import {
//   User,
//   Event,
//   PrismaClient,
//   Booking,
//   BookingStatus,
//   WaitList,
// } from "@prisma/client";
// import { EventStatus } from "@prisma/client";
// import dayjs from "dayjs";
// import { BookingService } from "../../src/services/booking.service";
// import { EventService } from "../../src/services/event.service";
// import { WaitListService } from "../../src/services/waitList.service";
// import { CancelledBookingService } from "../../src/services/cancelledBooking.service";
// import { generateUUID } from "../util";
// import { faker } from "@faker-js/faker";
// import prisma from "../../src/config/prisma";
// import { UpdateEventOption } from "../../src/enum/event.enum";
// import { HttpException } from "../../src/exceptions/http.exception";

// jest.mock("../../src/config/prisma.ts", () => ({
//   __esModule: true,
//   default: mockDeep<PrismaClient>(),
// }));

// describe("BookingService unit test", () => {
//   // Mocked prisma client
//   const mockedPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

//   let bookingService: BookingService;

//   // Mocked dependencies
//   let eventService: MockProxy<EventService>;
//   let waitListService: MockProxy<WaitListService>;
//   let cancelBookingService: MockProxy<CancelledBookingService>;

//   // Mock user details
//   const userId: string = generateUUID();
//   const userName: string = `${faker.person.firstName()} ${faker.person.lastName()}`;
//   const email: string = faker.internet.email();
//   const phoneNumber: string = faker.phone.number();

//   const mockUser: User = {
//     id: userId,
//     name: userName,
//     email,
//     phoneNumber,
//     password: "hashedPassword",
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   };

//   // Mock event details
//   const eventId: string = generateUUID();
//   const eventName: string = "Test event";
//   const venue: string = "event_venue";
//   const totalTicket: number = 1;
//   const availableTicket: number = 1;
//   const startAt: Date = new Date("2026-10-15T14:30:00.000Z");
//   const endAt: Date = new Date("2026-10-18T14:30:00.000Z");

//   const mockEvent: Event = {
//     id: eventId,
//     userId,
//     name: eventName,
//     venue,
//     totalTicket,
//     availableTicket,
//     startAt,
//     endAt,
//     status: EventStatus.ACTIVE,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     deletedAt: null,
//   };

//   // Mock booking details
//   const bookingId: string = generateUUID();

//   const mockConfirmedBookingResponse: Booking = {
//     id: bookingId,
//     userId,
//     eventId,
//     status: BookingStatus.CONFIRMED,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     deletedAt: null,
//   };

//   beforeEach(() => {
//     jest.clearAllMocks();

//     // Instanciate mock dependencies
//     eventService = mock<EventService>();
//     waitListService = mock<WaitListService>();
//     cancelBookingService = mock<CancelledBookingService>();

//     bookingService = new BookingService(
//       eventService,
//       waitListService,
//       cancelBookingService
//     );
//   });

//   describe("book a ticket cases", () => {
//     it("should successfully book a ticket when tickets are available", async () => {
//       const mockTransaction = {
//         $queryRaw: jest.fn().mockResolvedValue([mockEvent]),
//         booking: {
//           create: jest.fn().mockResolvedValue(mockConfirmedBookingResponse),
//         },
//         event: {
//           update: jest.fn().mockResolvedValue({
//             ...mockEvent,
//             availableTicket: availableTicket - 1,
//           }),
//         },
//       };

//       mockedPrisma.$transaction.mockImplementation((callback) =>
//         callback(mockTransaction as any)
//       );

//       eventService.getEventInLockedMode.mockResolvedValue(mockEvent);

//       jest
//         .spyOn(bookingService, "createBooking")
//         .mockResolvedValue(mockConfirmedBookingResponse);

//       eventService.updateEventAvailableTicket.mockResolvedValue(undefined);

//       // Test the main function
//       const result = await bookingService.bookATicket(eventId, mockUser);

//       // Assert
//       expect(eventService.getEventInLockedMode).toHaveBeenCalledWith(
//         eventId,
//         mockTransaction
//       );
//       expect(bookingService.createBooking).toHaveBeenCalledWith(
//         eventId,
//         userId,
//         mockTransaction
//       );
//       expect(eventService.updateEventAvailableTicket).toHaveBeenCalledWith(
//         eventId,
//         UpdateEventOption.DECREMENT,
//         mockTransaction
//       );
//       // expect(prisma.$transaction).toHaveBeenCalled();
//       expect(waitListService.addToWaitList).not.toHaveBeenCalled();
//       expect(result).toEqual(mockConfirmedBookingResponse);
//     });

//     it("should add to waitlist when no tickets are available", async () => {
//       // Mock data setup
//       const mockEventWithExhaustedTickets: Event = {
//         ...mockEvent,
//         availableTicket: 0,
//       };

//       const mockWaitList: WaitList = {
//         id: generateUUID(),
//         userId,
//         eventId,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };

//       // Mock transaction setup
//       const mockTransaction = {
//         $queryRaw: jest.fn().mockResolvedValue([mockEventWithExhaustedTickets]),
//         waitList: {
//           create: jest.fn().mockResolvedValue(mockWaitList),
//         },
//       };

//       // Setup transaction mock
//       mockedPrisma.$transaction.mockImplementation((callback) =>
//         callback(mockTransaction as any)
//       );

//       // Setup service mocks
//       eventService.getEventInLockedMode.mockResolvedValue(
//         mockEventWithExhaustedTickets
//       );
//       waitListService.addToWaitList.mockResolvedValue(mockWaitList);

//       // Test the main function
//       const result = await bookingService.bookATicket(eventId, mockUser);

//       // Assert
//       expect(eventService.getEventInLockedMode).toHaveBeenCalledWith(
//         eventId,
//         mockTransaction // Use mockTransaction instead of mockedPrisma
//       );
//       expect(bookingService.createBooking).not.toHaveBeenCalled();
//       expect(eventService.updateEventAvailableTicket).not.toHaveBeenCalled();
//       expect(waitListService.addToWaitList).toHaveBeenCalledWith(
//         eventId,
//         userId,
//         mockTransaction // Use mockTransaction instead of mockedPrisma
//       );
//       expect(result).toEqual(mockWaitList);
//     });

//     it("should throw error for cancelled events", async () => {
//       const cancelledEvent = { ...mockEvent, status: EventStatus.CANCELLED };
//       eventService.getEventInLockedMode.mockResolvedValue(cancelledEvent);

//       // Act & Assert
//       await expect(
//         bookingService.bookATicket(eventId, mockUser)
//       ).rejects.toThrow(new HttpException(400, "Event date is past"));
//       expect(bookingService.createBooking).not.toHaveBeenCalled();
//       expect(eventService.updateEventAvailableTicket).not.toHaveBeenCalled();
//       expect(waitListService.addToWaitList).not.toHaveBeenCalled();
//     });

//     it("should throw error for past events", async () => {
//       const pastEvent = {
//         ...mockEvent,
//         endAt: dayjs().subtract(1, "day").toDate(),
//       };

//       eventService.getEventInLockedMode.mockResolvedValue(pastEvent);

//       // Act & Assert
//       await expect(
//         bookingService.bookATicket(eventId, mockUser)
//       ).rejects.toThrow(new HttpException(400, "Event date is past"));
//       expect(bookingService.createBooking).not.toHaveBeenCalled();
//       expect(eventService.updateEventAvailableTicket).not.toHaveBeenCalled();
//       expect(waitListService.addToWaitList).not.toHaveBeenCalled();
//     });

//     it("should handle transaction failure", async () => {
//       const transactionError = new Error("Transaction failed");

//       // prisma.$transaction.mockRejectedValue(transactionError);

//       // Act & Assert
//       await expect(
//         bookingService.bookATicket(eventId, mockUser)
//       ).rejects.toThrow(transactionError);
//     });

//     it("should handle event not found", async () => {
//       eventService.getEventInLockedMode.mockResolvedValue(null);

//       // Act & Assert
//       await expect(
//         bookingService.bookATicket(eventId, mockUser)
//       ).rejects.toThrow(new HttpException(404, "Event does not exist"));
//       expect(bookingService.createBooking).not.toHaveBeenCalled();
//       expect(eventService.updateEventAvailableTicket).not.toHaveBeenCalled();
//       expect(waitListService.addToWaitList).not.toHaveBeenCalled();
//     });
//   });
// });
