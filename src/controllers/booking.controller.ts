import { BookingService } from "@/services/booking.service";
import Container from "typedi";

export class BookingController {
  public eventService = Container.get(BookingService);
}
