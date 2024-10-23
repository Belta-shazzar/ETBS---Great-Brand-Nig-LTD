import { BookingCancellationDto } from "@/dtos/booking.dto";
import { Service } from "typedi";

@Service()
export class CancelledBookingService {

  public async createCancellationRecord(
    cancellationData: BookingCancellationDto,
    transaction: any
  ): Promise<void> {
    await transaction.cancelledBooking.create({
      data: cancellationData,
    });
  }
}
