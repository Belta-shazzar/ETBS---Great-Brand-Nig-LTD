import { PrismaClient, WaitList } from "@prisma/client";

export class WaitListService {
  public waitList = new PrismaClient().waitList;

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
