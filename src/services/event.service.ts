import { InitializeEventDto } from "@/dtos/event.dto";
import { HttpException } from "@/exceptions/http.exception";
import { EventStatusResponse } from "@/interfaces/event.interface";
import { Event, PrismaClient } from "@prisma/client";
import Container, { Service } from "typedi";
import { WaitListService } from "@services/waitList.service";
import { UpdateEventOption } from "@/enum/event.enum";

@Service()
export class EventService {
  public event = new PrismaClient().event;
  public waitListService = Container.get(WaitListService);

  //   Awaiting unit test [TDD]
  public async initializeEvent(eventDto: InitializeEventDto): Promise<Event> {
    return null;
  }

  public async getEventById(eventId: string): Promise<Event> {
    const event: Event = await this.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) throw new HttpException(404, "Event doesn't exist");
    return event;
  }

  //   Awaiting unit test [TDD]
  public async getEventStatus(eventId: string): Promise<EventStatusResponse> {
    // Get event by event id
    // Get all waitList by event id
    // return an object of partial event and waitlist count
    return null;
  }

  public async updateEventTotalAndAvailableTicket(
    eventId: string,
    updateEventOption: UpdateEventOption
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

    const updatedEvent = await this.event.update({
      where: { id: eventId },
      data: updateData,
    });
  }
}
