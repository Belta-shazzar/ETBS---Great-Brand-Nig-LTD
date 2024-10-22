import { BookingCancellationDto } from "@/dtos/booking.dto";
import prisma from "@/config/prisma";
import { Service } from "typedi";

@Service()
export class CancelledBookingService {
  public cancelledBooking = prisma.cancelledBooking;

  public async createCancellationRecord(
    cancellationData: BookingCancellationDto,
    transaction: any
  ): Promise<void> {
    await transaction.cancelledBooking.create({
      data: cancellationData,
    });
  }
}
