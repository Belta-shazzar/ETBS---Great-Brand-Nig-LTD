import { BookingCancellationDto } from "@/dtos/booking.dto";
import {
  Booking,
  BookingStatus,
  Event,
  EventStatus,
  User,
} from "@prisma/client";
import { WaitListService } from "@services/waitList.service";
import { EventService } from "@services/event.service";
import dayjs from "dayjs";
import { HttpException } from "@/exceptions/http.exception";
import { UpdateEventOption } from "@/enum/event.enum";
import { CancelledBookingService } from "./cancelledBooking.service";
import prisma from "@/config/prisma";
import { Service } from "typedi";

@Service()
export class BookingService {
  private booking = prisma.booking;

  constructor(
    private eventService: EventService,
    private waitListService: WaitListService,
    private cancelBookingService: CancelledBookingService
  ) {}

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

  public async bookATicket(eventId: string, user: User): Promise<any> {
    // Begin transaction process
    return await prisma.$transaction(async (transaction) => {
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
    user: User
  ): Promise<Booking> {
    const checkBooking = await this.booking.findUnique({
      where: { id: cancellationDto.bookingId },
    });
    if (!checkBooking || checkBooking.status === BookingStatus.CANCELLED)
      throw new HttpException(404, "Ticket not found");

    return await prisma.$transaction(async (transaction) => {
      const bookedTicket: Booking = await transaction.booking.update({
        where: { id: cancellationDto.bookingId, userId: user.id },
        data: { status: BookingStatus.CANCELLED },
      });

      const { eventId } = bookedTicket;
      await this.cancelBookingService.createCancellationRecord(
        cancellationDto,
        transaction
      );

      const checkWaitList = await this.waitListService.getOldestWaitListEntry(
        eventId
      );

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
