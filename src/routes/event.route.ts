import { EventController } from "@/controllers/event.controller";
import { InitializeEventDto } from "@/dtos/event.dto";
import { Routes } from "@/interfaces/routes.interface";
import { AuthMiddleware } from "@/middlewares/auth.middleware";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { Router } from "express";

export class EventRoute implements Routes {
  public path: string = "/events";
  public router: Router = Router();
  private eventController = new EventController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/initialize`,
      AuthMiddleware,
      ValidationMiddleware(InitializeEventDto),
      this.eventController.initializeEvent
    );
    
    this.router.get(
      `${this.path}/status/:eventId`,
      this.eventController.getEventStatus
    );
  }
}
