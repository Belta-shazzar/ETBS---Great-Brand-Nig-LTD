import { BookingService } from "@/services/booking.service";
import Container from "typedi";
import { Request, Response, NextFunction } from "express";

export class BookingController {
  public eventService = Container.get(BookingService);

  public bookATicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // receive eventId, user[name, email, phoneNumber]
      // get event by id
      // Ensure there's enough ticket
      // implement transaction and role lock for update on event to handle race conditioning
      // create a user model
      // create booking and add the user to it
      // if there's not enough ticket and event status is active, then add the user to wait list.
      // if the event is not active, return an appropriate response message
      res.status(201).json({ data: "", message: "Ticket booked" });
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
      // receive bookingId and reason for cancellation [Optionsl]
      // implement transaction and row lock, then update the booking status to cancelled
      // create cancelledBooking model with available details
      // check wait list and create a new booking for the first user while deleting the user from the wait list
      // If there's no user on the wait list, increment number of available ticket. [Transaction and row lock should be implemented]
      // return a booking cancelled message
      res.status(200).json({ data: "", message: "Booking cancelled" });
    } catch (error) {
      next(error);
    }
  };
}
