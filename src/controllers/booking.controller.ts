import { BookingService } from "@/services/booking.service";
import Container from "typedi";
import { Request, Response, NextFunction } from "express";
import { BookingCancellationDto, BookTicketDto } from "@/dtos/booking.dto";

export class BookingController {
  public bookingService = Container.get(BookingService);

  public bookATicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const bookingData: BookTicketDto = req.body;
      const bookedTicket: any = await this.bookingService.bookATicket(
        bookingData
      );

      const message: string = bookedTicket.status
        ? "Ticket booked successfully"
        : "You have been added to the wait list as tickets are currently unavailable";

      res.status(200).json({ message, data: bookedTicket });
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
      res
        .status(200)
        .json({ data: "", message: "Booking cancelled successfully" });
    } catch (error) {
      next(error);
    }
  };
}
