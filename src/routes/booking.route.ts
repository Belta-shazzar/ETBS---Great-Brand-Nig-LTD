import { BookingController } from "@/controllers/booking.controller";
import { BookingCancellationDto, BookTicketDto } from "@/dtos/booking.dto";
import { Routes } from "@/interfaces/routes.interface";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { Router } from "express";

export class BookingRoute implements Routes {
  public path: string = "/bookings";
  public router: Router = Router();
  public bookingController = new BookingController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/book`,
      ValidationMiddleware(BookTicketDto),
      this.bookingController.bookATicket
    );

    this.router.post(
      `${this.path}/cancel`,
      ValidationMiddleware(BookingCancellationDto),
      this.bookingController.cancelBooking
    );
  }
}
