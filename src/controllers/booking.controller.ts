import { BookingService } from "@/services/booking.service";
import { Response, NextFunction } from "express";
import { BookingCancellationDto } from "@/dtos/booking.dto";
import { RequestWithUser } from "@/interfaces/auth.interface";
import Container from "typedi";

export class BookingController {
  private bookingService = Container.get(BookingService);

  public bookATicket = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { eventId } = req.body;
      const { user } = req;
      const response: any = await this.bookingService.bookATicket(
        eventId,
        user
      );

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
      const { user } = req;
      await this.bookingService.cancelBooking(bookingCancellationData, user);
      res.status(200).json({ message: "Booking cancelled successfully" });
    } catch (error) {
      next(error);
    }
  };
}
