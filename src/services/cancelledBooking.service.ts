import { BookingCancellationDto } from "@/dtos/booking.dto";
import { CancelledBooking, PrismaClient } from "@prisma/client";
import { Service } from "typedi";

@Service()
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
