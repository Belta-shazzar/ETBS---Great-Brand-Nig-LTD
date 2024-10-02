import { EventService } from "@/services/event.service";
import Container from "typedi";

export class EventController {
  public eventService = Container.get(EventService);
}
