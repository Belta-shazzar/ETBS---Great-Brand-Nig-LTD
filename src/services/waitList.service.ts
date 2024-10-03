import { PrismaClient, WaitList } from "@prisma/client";
import { Service } from "typedi";

@Service()
export class WaitListService {
  public waitList = new PrismaClient().waitList;

  //   Awaiting unit test [TDD]
  public async addToWaitList(
    eventId: string,
    userId: string
  ): Promise<WaitList> {
    return null;
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

  public async deleteRecordFromList(waitListId: string): Promise<void> {
    await this.waitList.delete({
      where: {
        id: waitListId,
      },
    });
  }
}
