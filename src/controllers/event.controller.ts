import { EventService } from "@/services/event.service";
import { NextFunction, Request, Response } from "express";
import { InitializeEventDto } from "@/dtos/event.dto";
import { Event } from "@prisma/client";
import { EventStatusResponse } from "@/interfaces/event.interface";
import Container from "typedi";
import { RequestWithUser } from "@/interfaces/auth.interface";

export class EventController {
  private eventService = Container.get(EventService);

  public initializeEvent = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const eventData: InitializeEventDto = req.body;
      const { id } = req.user;
      const initializedEvent: Event = await this.eventService.initializeEvent(
        eventData,
        id
      );

      res.status(201).json(initializedEvent);
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

      res.status(200).json(eventStatus);
    } catch (error) {
      next(error);
    }
  };
}
