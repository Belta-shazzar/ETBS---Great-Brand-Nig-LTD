import { PrismaClient, Event } from "@prisma/client";
import { EventService } from "../../src/services/event.service";
import { InitializeEventDto } from "../../src/dtos/event.dto";
import { EventStatusResponse } from "../../src/interfaces/event.interface";

let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient();
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.cancelledBooking.deleteMany();
  await prisma.waitList.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  
  await prisma.$disconnect();
});

describe("Event Service", () => {
  it("should initialize a new event", async () => {
    const eventService = new EventService();

    const eventDto: InitializeEventDto = {
      name: "Tech Stars",
      totalTicket: 30,
      venue: "Ikeja",
      startAt: new Date("2024-10-15"),
      endAt: new Date("2024-10-18"),
    };
    const initiatedEvent: Event = await eventService.initializeEvent(eventDto);

    expect(initiatedEvent).toHaveProperty("id");
    expect(typeof initiatedEvent.id).toBe("string");
  });

  it("should get current status of event", async () => {
    const eventService = new EventService();

    const eventDto: InitializeEventDto = {
      name: "Tech Stars",
      totalTicket: 30,
      venue: "Ikeja",
      startAt: new Date("2024-10-15"),
      endAt: new Date("2024-10-18"),
    };

    const event: Event = await eventService.initializeEvent(eventDto);
    const eventStatus: EventStatusResponse = await eventService.getEventStatus(
      event.id
    );

    expect(eventStatus).toHaveProperty("event");
    expect(eventStatus).toHaveProperty("waitListCount");
    expect(typeof eventStatus.waitListCount).toBe("number");
  });
});
