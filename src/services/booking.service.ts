import { BookingCancellationDto, BookTicketDto } from "@/dtos/booking.dto";
import { Booking, PrismaClient } from "@prisma/client";
import Container, { Service } from "typedi";
import { UserService } from "@services/user.service";
import { WaitListService } from "@services/waitList.service";
import { BookingStatus } from "@/enum/booking.enum";

@Service()
export class BookingService {
  public booking = new PrismaClient().booking;
  public userService = Container.get(UserService);
  public waitListService = Container.get(WaitListService);

  public async createBooking(
    eventId: string,
    userId: string
  ): Promise<Booking> {
    return this.booking.create({
      data: {
        userId,
        eventId,
        status: BookingStatus.CONFIRMED,
      },
    });
  }

  //   Awaiting unit test [TDD]
  public async bookATicket(bookingDto: BookTicketDto): Promise<Booking> {
    // receive eventId, user[name, email, phoneNumber]
    // get event by id
    // Ensure there's enough ticket
    // implement transaction and role lock for update on event to handle race conditioning
    // create a user model
    // create booking and add the user to it
    // if there's not enough ticket and event status is active, then add the user to wait list.
    // if the event is not active, return an appropriate response message
    return null;
  }

  //   Awaiting unit test [TDD]
  public async cancelBooking(
    cancellationDto: BookingCancellationDto
  ): Promise<void> {
    // receive bookingId and reason for cancellation [Optionsl]
    // implement transaction and row lock, then update the booking status to cancelled
    // create cancelledBooking model with available details
    // check wait list and create a new booking for the first user while deleting the user from the wait list
    // If there's no user on the wait list, increment number of available ticket. [Transaction and row lock should be implemented]
  }
}
