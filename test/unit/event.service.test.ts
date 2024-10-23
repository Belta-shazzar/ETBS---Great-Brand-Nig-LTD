import { Event, EventStatus, PrismaClient, WaitList } from "@prisma/client";
import { DeepMockProxy, mock, mockDeep, MockProxy } from "jest-mock-extended";
import prisma from "../../src/config/prisma";
import { EventService } from "../../src/services/event.service";
import { WaitListService } from "../../src/services/waitList.service";
import { generateUUID } from "../util";
import { InitializeEventDto } from "../../src/dtos/event.dto";
import { HttpException } from "../../src/exceptions/http.exception";
import { UpdateEventOption } from "../../src/enum/event.enum";

// Mock the prisma config module
jest.mock("../../src/config/prisma.ts", () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));


describe("EventService unit test", () => {
  const mockedPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;
  let eventService: EventService;
  let waitListService: MockProxy<WaitListService>;

  const eventId: string = generateUUID();
  const userId: string = generateUUID();
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

  beforeEach(() => {
    jest.clearAllMocks();

    waitListService = mock<WaitListService>();
    eventService = new EventService(waitListService);
  });

  describe("Initialize event case", () => {
    it("should initialize a new event", async () => {
      const eventDto: InitializeEventDto = {
        name: eventName,
        totalTicket,
        venue,
        startAt,
        endAt,
      };

      mockedPrisma.event.create.mockResolvedValue(mockEvent);

      const result = await eventService.initializeEvent(eventDto, userId);

      expect(mockedPrisma.event.create).toHaveBeenCalledWith({
        data: {
          ...eventDto,
          userId,
          availableTicket: eventDto.totalTicket,
          status: EventStatus.ACTIVE,
        },
      });
      expect(result).toEqual(mockEvent);
    });
  });

  describe("Get event by id cases", () => {
    it("should return an event when found", async () => {
      mockedPrisma.event.findUnique.mockResolvedValue(mockEvent);

      const result = await eventService.getEventById(eventId);

      expect(mockedPrisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
      });
      expect(result).toEqual(mockEvent);
    });

    it("should throw HttpException when user is not found", async () => {
      mockedPrisma.event.findUnique.mockResolvedValue(null);

      await expect(eventService.getEventById(eventId)).rejects.toThrow(
        new HttpException(404, "Event does not exist")
      );

      expect(mockedPrisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
      });
    });
  });

  describe("Get event in locked mode", () => {
    let mockTransaction: any;
    it("should return an event in locked mode when found", async () => {
      jest.spyOn(eventService, "getEventById").mockResolvedValue(mockEvent);
      // Create a mock transaction that returns the mocked query result
      mockTransaction = {
        $queryRaw: jest.fn().mockResolvedValue([mockEvent]),
      };

      const result = await eventService.getEventInLockedMode(
        mockEvent.id,
        mockTransaction
      );

      expect(eventService.getEventById).toHaveBeenCalledWith(mockEvent.id);
      expect(mockTransaction.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(mockEvent);
    });

    it("should throw error when event is not found", async () => {
      const mockTransaction = {
        $queryRaw: jest.fn(),
      };

      await expect(
        eventService.getEventInLockedMode(mockEvent.id, mockTransaction)
      ).rejects.toThrow(new HttpException(404, "Event does not exist"));
      expect(mockTransaction.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe("Get event status cases", () => {
    const mockWaitList: WaitList[] = [
      {
        id: generateUUID(),
        eventId: mockEvent.id,
        userId: generateUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: generateUUID(),
        eventId: mockEvent.id,
        userId: generateUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it("should return event status with wait list count", async () => {
      jest.spyOn(eventService, "getEventById").mockResolvedValue(mockEvent);
      waitListService.getWaitListByEventId.mockResolvedValue(mockWaitList);

      const result = await eventService.getEventStatus(mockEvent.id);

      expect(eventService.getEventById).toHaveBeenCalledWith(mockEvent.id);
      expect(waitListService.getWaitListByEventId).toHaveBeenCalledWith(
        mockEvent.id
      );
      expect(result).toEqual({
        event: mockEvent,
        waitListCount: mockWaitList.length,
      });
    });

    it("should return zero wait list count when no wait list exists", async () => {
      jest.spyOn(eventService, "getEventById").mockResolvedValue(mockEvent);
      waitListService.getWaitListByEventId.mockResolvedValue([]);

      const result = await eventService.getEventStatus(mockEvent.id);

      expect(result).toEqual({
        event: mockEvent,
        waitListCount: 0,
      });
    });

    it("should throw error when event is not found", async () => {
      await expect(eventService.getEventStatus(mockEvent.id)).rejects.toThrow(
        new HttpException(404, "Event does not exist")
      );
      expect(waitListService.getWaitListByEventId).not.toHaveBeenCalled();
    });
  });

  describe("Update event available ticket", () => {
    let mockTransaction: any;
    it("should increment available ticket count", async () => {
      // Create mock transaction
      mockTransaction = {
        event: {
          update: jest.fn().mockResolvedValue(mockEvent),
        },
      };

      await eventService.updateEventAvailableTicket(
        mockEvent.id,
        UpdateEventOption.INCREMENT,
        mockTransaction
      );

      expect(mockTransaction.event.update).toHaveBeenCalledWith({
        where: { id: mockEvent.id },
        data: {
          availableTicket: {
            increment: 1,
          },
        },
      });
    });

    it("should decrement available ticket count", async () => {
      // Create mock transaction
      const mockTransaction = {
        event: {
          update: jest.fn().mockResolvedValue(mockEvent),
        },
      };

      await eventService.updateEventAvailableTicket(
        mockEvent.id,
        UpdateEventOption.DECREMENT,
        mockTransaction
      );

      expect(mockTransaction.event.update).toHaveBeenCalledWith({
        where: { id: mockEvent.id },
        data: {
          availableTicket: {
            decrement: 1,
          },
        },
      });
    });
  });
});
