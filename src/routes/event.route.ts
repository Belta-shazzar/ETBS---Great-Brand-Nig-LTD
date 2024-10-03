import { EventController } from "@/controllers/event.controller";
import { Routes } from "@/interfaces/routes.interface";
import { Router } from "express";

export class EventRoute implements Routes {
  public path: string = "/events";
  public router: Router = Router();
  public eventController = new EventController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/initialize`, this.eventController.initializeEvent)
    this.router.get(`${this.path}/status/:eventId`, this.eventController.getEventStatus)
  }
}
