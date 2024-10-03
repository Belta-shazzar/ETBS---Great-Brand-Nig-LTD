import { EventService } from "@/services/event.service";
import Container from "typedi";
import { NextFunction, Request, Response } from "express";

export class EventController {
  public eventService = Container.get(EventService);

  public initializeEvent = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Validate startAt, endAt, and totalTickets
      // create new event with name and total ticket available
      // return event
      res.status(201).json({ data: "", message: "Event initialized" });
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
      // Get event by id
      // get waitlist by event id
      // return available tickets, waiting list count and event status

      res.status(200).json({ data: "", message: "Event status retrieved" });
    } catch (error) {
      next(error);
    }
  };
}
