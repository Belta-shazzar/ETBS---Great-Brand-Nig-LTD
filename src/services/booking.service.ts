import { BookingCancellationDto } from "@/dtos/booking.dto";
import {
  Booking,
  BookingStatus,
  PrismaClient,
  Event,
  EventStatus,
  User,
} from "@prisma/client";
import { UserService } from "@services/user.service";
import { WaitListService } from "@services/waitList.service";
import { EventService } from "@services/event.service";
import dayjs from "dayjs";
import { HttpException } from "@/exceptions/http.exception";
import { UpdateEventOption } from "@/enum/event.enum";
import { CancelledBookingService } from "./cancelledBooking.service";

export class BookingService {
  public prisma = new PrismaClient();
  public booking = this.prisma.booking;

  public eventService = new EventService();
  public userService = new UserService();
  public waitListService = new WaitListService();
  public cancelBookingService = new CancelledBookingService();

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

  public async bookATicket(eventId: string, userId: string): Promise<any> {
    const user: User = await this.userService.getUserById(userId);

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
    cancellationDto: BookingCancellationDto,
    userId: string
  ): Promise<Booking> {
    const checkBooking = await this.booking.findUnique({
      where: { id: cancellationDto.bookingId },
    });
    if (!checkBooking || checkBooking.status === BookingStatus.CANCELLED)
      throw new HttpException(404, "Ticket not found");

    return await this.prisma.$transaction(async (transaction) => {
      const bookedTicket: Booking = await transaction.booking.update({
        where: { id: cancellationDto.bookingId, userId: userId },
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
