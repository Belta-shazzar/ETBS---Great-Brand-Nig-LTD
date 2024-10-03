import { BookingController } from "@/controllers/booking.controller";
import { Routes } from "@/interfaces/routes.interface";
import { Router } from "express";

export class BookingRoute implements Routes {
  public path: string = "/bookings";
  public router: Router = Router();
  public bookingController = new BookingController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/book`, this.bookingController.bookATicket)
    this.router.post(`${this.path}/cancel`, this.bookingController.cancelBooking)
    // booking id would be on request body for cancel and event for book
  }
}
