import { EventController } from "@/controllers/event.controller";
import { Routes } from "@/interfaces/routes.interface";
import { Router } from "express";

export class EventRoute implements Routes {
  public path: string = "/events";
  public router: Router = Router();

  public eventController = new EventController();
}
