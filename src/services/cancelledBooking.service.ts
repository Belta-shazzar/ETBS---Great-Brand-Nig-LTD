import { CancelledBooking, PrismaClient } from "@prisma/client";
import { Service } from "typedi";

@Service()
export class CancelledBookingService {
  public cancelledBooking = new PrismaClient().cancelledBooking;

  public async createCancellationRecord(
    cancellationData: Partial<CancelledBooking>
  ): Promise<void> {
    const { bookingId, reason } = cancellationData;
    await this.cancelledBooking.create({
      data: {
        bookingId,
        reason,
      },
    });
  }
}
