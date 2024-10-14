import { BookingCancellationDto } from "@/dtos/booking.dto";
import { PrismaClient } from "@prisma/client";

export class CancelledBookingService {
  public cancelledBooking = new PrismaClient().cancelledBooking;

  public async createCancellationRecord(
    cancellationData: BookingCancellationDto,
    transaction: any
  ): Promise<void> {
    await transaction.cancelledBooking.create({
      data: cancellationData,
    });
  }
}
