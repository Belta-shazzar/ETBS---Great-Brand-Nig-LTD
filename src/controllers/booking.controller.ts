import { BookingService } from "@/services/booking.service";
import { Response, NextFunction } from "express";
import { BookingCancellationDto } from "@/dtos/booking.dto";
import { RequestWithUser } from "@/interfaces/auth.interface";
import Container from "typedi";

export class BookingController {
  public bookingService = Container.get(BookingService);

  public bookATicket = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { eventId } = req.body;
      const { id } = req.user;
      const response: any = await this.bookingService.bookATicket(eventId, id);

      const message: string = response.status
        ? "Ticket booked successfully"
        : "You have been added to the wait list as tickets are currently unavailable";

      res.status(200).json({ message, response });
    } catch (error) {
      next(error);
    }
  };

  public cancelBooking = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const bookingCancellationData: BookingCancellationDto = req.body;
      const { id } = req.user;
      await this.bookingService.cancelBooking(bookingCancellationData, id);
      res.status(200).json({ message: "Booking cancelled successfully" });
    } catch (error) {
      next(error);
    }
  };
}
