import { PrismaClient, WaitList } from "@prisma/client";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import prisma from "../../src/config/prisma";
import { WaitListService } from "../../src/services/waitList.service";
import { generateUUID } from "../util";

// Mock prisma config module
jest.mock("../../src/config/prisma.ts", () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

describe("WaitListService", () => {
  const mockedPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;
  let waitListService: WaitListService;

  const waitListId: string = generateUUID();
  const eventId: string = generateUUID();
  const userId: string = generateUUID();

  const mockWaitList: WaitList = {
    id: waitListId,
    eventId,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    waitListService = new WaitListService();
  });

  describe("Add to waitlist case", () => {
    it("should successfully add user to wait list", async () => {
      // Mock transaction setup
      const mockTransaction = {
        waitList: {
          create: jest.fn().mockResolvedValue(mockWaitList),
        },
      };

      // Execute addToWaitList
      const result = await waitListService.addToWaitList(
        mockWaitList.eventId,
        mockWaitList.userId,
        mockTransaction
      );

      // Verify
      expect(result).toEqual(mockWaitList);
      expect(mockTransaction.waitList.create).toHaveBeenCalledWith({
        data: {
          eventId: mockWaitList.eventId,
          userId: mockWaitList.userId,
        },
      });
    });
  });

  describe("Get wait list by event id", () => {
    const mockWaitListArray: WaitList[] = [
      {
        id: generateUUID(),
        eventId: mockWaitList.eventId,
        userId: mockWaitList.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: generateUUID(),
        eventId: mockWaitList.eventId,
        userId: mockWaitList.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    it("should return all wait list entries for an event", async () => {
      mockedPrisma.waitList.findMany.mockResolvedValue(mockWaitListArray);

      const result = await waitListService.getWaitListByEventId(
        mockWaitList.eventId
      );

      expect(result).toEqual(mockWaitListArray);
      expect(mockedPrisma.waitList.findMany).toHaveBeenCalledWith({
        where: { eventId: mockWaitList.eventId },
      });
    });

    it("should return empty array when no entries exist", async () => {
      mockedPrisma.waitList.findMany.mockResolvedValue([]);

      const result = await waitListService.getWaitListByEventId(
        "non-existent-event"
      );

      expect(mockedPrisma.waitList.findMany).toHaveBeenCalledWith({
        where: { eventId: "non-existent-event" },
      });
      expect(result).toEqual([]);
    });
  });

  describe("Get oldest waitlist entry", () => {
    it("should return the oldest wait list entry", async () => {
      mockedPrisma.waitList.findFirst.mockResolvedValue(mockWaitList);

      const result = await waitListService.getOldestWaitListEntry(
        mockWaitList.eventId
      );

      expect(mockedPrisma.waitList.findFirst).toHaveBeenCalledWith({
        where: { eventId: mockWaitList.eventId },
        orderBy: { createdAt: "asc" },
      });
      expect(result).toEqual(mockWaitList);
    });

    it("should return null when no entries exist", async () => {
      mockedPrisma.waitList.findFirst.mockResolvedValue(null);

      const result = await waitListService.getOldestWaitListEntry(
        "non-existent-event"
      );

      expect(result).toBeNull();
      expect(mockedPrisma.waitList.findFirst).toHaveBeenCalledWith({
        where: { eventId: "non-existent-event" },
        orderBy: { createdAt: "asc" },
      });
    });
  });

  describe("Delete record from waitlist", () => {
    it("should successfully delete wait list record", async () => {
      const mockTransaction = {
        waitList: {
          delete: jest.fn().mockResolvedValue(mockWaitList),
        },
      };

      await waitListService.deleteRecordFromList(
        mockWaitList.id,
        mockTransaction
      );

      expect(mockTransaction.waitList.delete).toHaveBeenCalledWith({
        where: { id: mockWaitList.id },
      });
    });
  });
});
