import { BookingService } from "@/services/booking.service";
import Container from "typedi";
import { Request, Response, NextFunction } from "express";
import { BookingCancellationDto, BookTicketDto } from "@/dtos/booking.dto";
import { Booking } from "@prisma/client";

export class BookingController {
  public bookingService = Container.get(BookingService);

  public bookATicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const bookingData: BookTicketDto = req.body;
      const bookedTicket: Booking = await this.bookingService.bookATicket(
        bookingData
      );
      res.status(201).json({ data: bookedTicket, message: "Ticket booked" });
    } catch (error) {
      next(error);
    }
  };

  public cancelBooking = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const bookingCancellationData: BookingCancellationDto = req.body;
      await this.bookingService.cancelBooking(bookingCancellationData);
      res.status(200).json({ data: "", message: "Booking cancelled" });
    } catch (error) {
      next(error);
    }
  };
}
