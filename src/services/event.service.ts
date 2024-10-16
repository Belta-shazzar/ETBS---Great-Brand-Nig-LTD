import { InitializeEventDto } from "@/dtos/event.dto";
import { HttpException } from "@/exceptions/http.exception";
import { EventStatusResponse } from "@/interfaces/event.interface";
import { Event, EventStatus, PrismaClient, WaitList } from "@prisma/client";
import { WaitListService } from "@services/waitList.service";
import { UpdateEventOption } from "@/enum/event.enum";

export class EventService {
  public prisma = new PrismaClient();
  public event = this.prisma.event;
  public waitListService = new WaitListService();

  public async initializeEvent(eventDto: InitializeEventDto): Promise<Event> {
    const event: Event = await this.event.create({
      data: {
        ...eventDto,
        availableTicket: eventDto.totalTicket,
        status: EventStatus.ACTIVE,
      },
    });
    return event;
  }

  public async getEventById(eventId: string): Promise<Event> {
    const event: Event = await this.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) throw new HttpException(404, "Event does not exist");
    return event;
  }

  public async getEventInLockedMode(
    eventId: string,
    transaction: any
  ): Promise<any> {
    const event = await this.getEventById(eventId);
    const [eventWithLock] = await transaction.$queryRaw`
      SELECT * 
      FROM "Event" 
      WHERE id = ${event.id}::uuid
      FOR UPDATE;
    `;

    if (!eventWithLock) throw new HttpException(404, "Event does not exist");
    return eventWithLock;
  }

  public async getEventStatus(eventId: string): Promise<EventStatusResponse> {
    const event: Event = await this.getEventById(eventId);
    const waitList: WaitList[] =
      await this.waitListService.getWaitListByEventId(event.id);

    return { event, waitListCount: waitList.length };
  }

  public async updateEventAvailableTicket(
    eventId: string,
    updateEventOption: UpdateEventOption,
    transaction: any
  ): Promise<void> {
    const updateData =
      updateEventOption === UpdateEventOption.INCREMENT
        ? {
            availableTicket: {
              increment: 1,
            },
          }
        : {
            availableTicket: {
              decrement: 1,
            },
          };

    await transaction.event.update({
      where: { id: eventId },
      data: updateData,
    });
  }
}
