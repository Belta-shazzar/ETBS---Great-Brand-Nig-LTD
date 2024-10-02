import { BookingController } from "@/controllers/booking.controller";
import { Routes } from "@/interfaces/routes.interface";
import { Router } from "express";

export class BookingRoute implements Routes {
  public path: string = "/bookings";
  public router: Router = Router();

  public bookingController = new BookingController();
}
