import prisma from "@/config/prisma";
import { WaitList } from "@prisma/client";
import { Service } from "typedi";

@Service()
export class WaitListService {
  public waitList = prisma.waitList;

  public async addToWaitList(
    eventId: string,
    userId: string,
    transaction: any
  ): Promise<WaitList> {
    const waitList: WaitList = await transaction.waitList.create({
      data: {
        eventId,
        userId,
      },
    });
    return waitList;
  }

  public async getWaitListByEventId(eventId: string): Promise<WaitList[]> {
    const waitList: WaitList[] = await this.waitList.findMany({
      where: { eventId },
    });

    return waitList;
  }

  public async getOldestUserOnEventWaitList(
    eventId: string
  ): Promise<WaitList> {
    const oldestOnTheList: WaitList = await this.waitList.findFirst({
      where: {
        eventId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    return oldestOnTheList;
  }

  public async deleteRecordFromList(
    waitListId: string,
    transaction: any
  ): Promise<void> {
    await transaction.waitList.delete({
      where: {
        id: waitListId,
      },
    });
  }
}
