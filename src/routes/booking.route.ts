import { BookingController } from "@/controllers/booking.controller";
import { BookingCancellationDto } from "@/dtos/booking.dto";
import { Routes } from "@/interfaces/routes.interface";
import { AuthMiddleware } from "@/middlewares/auth.middleware";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { Router } from "express";

export class BookingRoute implements Routes {
  public path: string = "/bookings";
  public router: Router = Router();
  private bookingController = new BookingController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/book`,
      AuthMiddleware,
      this.bookingController.bookATicket
    );

    this.router.post(
      `${this.path}/cancel`,
      AuthMiddleware,
      ValidationMiddleware(BookingCancellationDto),
      this.bookingController.cancelBooking
    );
  }
}
