import { BookingCancellationDto, BookTicketDto } from "@/dtos/booking.dto";
import {
  Booking,
  BookingStatus,
  PrismaClient,
  Event,
  EventStatus,
  User,
} from "@prisma/client";
import Container, { Service } from "typedi";
import { UserService } from "@services/user.service";
import { WaitListService } from "@services/waitList.service";
import { EventService } from "@services/event.service";
import dayjs from "dayjs";
import { HttpException } from "@/exceptions/http.exception";
import { UpdateEventOption } from "@/enum/event.enum";
import { CancelledBookingService } from "./cancelledBooking.service";

@Service()
export class BookingService {
  public prisma = new PrismaClient();
  public booking = this.prisma.booking;
  public eventService = Container.get(EventService);
  public userService = Container.get(UserService);
  public waitListService = Container.get(WaitListService);
  public cancelBookingService = Container.get(CancelledBookingService);

  public async createBooking(
    eventId: string,
    userId: string,
    transaction: any
  ): Promise<Booking> {
    return transaction.booking.create({
      data: {
        userId,
        eventId,
        status: BookingStatus.CONFIRMED,
      },
    });
  }

  public async bookATicket(bookingDto: BookTicketDto): Promise<any> {
    const { eventId, name, email, phoneNumber } = bookingDto;
    const user: User = await this.userService.createUser({
      name,
      email,
      phoneNumber,
    });

    // Begin transaction process
    return await this.prisma.$transaction(async (transaction) => {
      let bookingResponse: any;
      const event: Event = await this.eventService.getEventInLockedMode(
        eventId,
        transaction
      );

      if (
        event.status === EventStatus.CANCELLED ||
        dayjs(event.endAt).isBefore(dayjs())
      )
        throw new HttpException(400, "Event date is past");

      if (event.availableTicket > 0) {
        bookingResponse = await this.createBooking(
          event.id,
          user.id,
          transaction
        );

        await this.eventService.updateEventAvailableTicket(
          event.id,
          UpdateEventOption.DECREMENT,
          transaction
        );
      } else {
        bookingResponse = await this.waitListService.addToWaitList(
          event.id,
          user.id,
          transaction
        );
      }

      return bookingResponse;
    });
  }

  public async cancelBooking(
    cancellationDto: BookingCancellationDto
  ): Promise<Booking> {
    return await this.prisma.$transaction(async (transaction) => {
      const bookedTicket: Booking = await transaction.booking.update({
        where: { id: cancellationDto.bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      const { eventId } = bookedTicket;
      await this.cancelBookingService.createCancellationRecord(
        cancellationDto,
        transaction
      );

      const checkWaitList =
        await this.waitListService.getOldestUserOnEventWaitList(eventId);

      if (checkWaitList) {
        await this.createBooking(eventId, checkWaitList.userId, transaction);
        await this.waitListService.deleteRecordFromList(
          checkWaitList.id,
          transaction
        );
        // Notify user from waiting list that they've been assigned a ticket
      } else {
        const event = await this.eventService.getEventInLockedMode(
          eventId,
          transaction
        );
        await this.eventService.updateEventAvailableTicket(
          event.id,
          UpdateEventOption.INCREMENT,
          transaction
        );
      }
      return bookedTicket;
    });
  }
}
