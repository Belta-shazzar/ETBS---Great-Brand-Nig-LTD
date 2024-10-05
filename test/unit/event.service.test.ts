import "reflect-metadata";
import { PrismaClient, Event } from "@prisma/client";
import { EventService } from "../../src/services/event.service";
import { InitializeEventDto } from "../../src/dtos/event.dto";
import { EventStatusResponse } from "../../src/interfaces/event.interface";
import Container from "typedi";

let prisma: PrismaClient;
let eventService: EventService

beforeAll(async () => {
  prisma = new PrismaClient();
  eventService = Container.get(EventService);

  await prisma.$connect();
  // await prisma.user.deleteMany();
});

beforeEach(async () => {
  // await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Event Service", () => {
  it("should initialize a new event", async () => {
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
