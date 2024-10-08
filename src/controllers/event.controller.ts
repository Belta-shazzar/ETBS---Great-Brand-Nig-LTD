import { EventService } from "@/services/event.service";
import Container from "typedi";
import { NextFunction, Request, Response } from "express";
import { InitializeEventDto } from "@/dtos/event.dto";
import { Event } from "@prisma/client";
import { EventStatusResponse } from "@/interfaces/event.interface";

export class EventController {
  public eventService = Container.get(EventService);

  public initializeEvent = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const eventData: InitializeEventDto = req.body;
      const initializedEvent: Event = await this.eventService.initializeEvent(
        eventData
      );

      res
        .status(201)
        .json({ message: "Event initialized", data: initializedEvent });
    } catch (error) {
      next(error);
    }
  };

  public getEventStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const eventId: string = req.params.eventId;

      const eventStatus: EventStatusResponse =
        await this.eventService.getEventStatus(eventId);

      res
        .status(200)
        .json({ message: "Event status retrieved", data: eventStatus });
    } catch (error) {
      next(error);
    }
  };
}
