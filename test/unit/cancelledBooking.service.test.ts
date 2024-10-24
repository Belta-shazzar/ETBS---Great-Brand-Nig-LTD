import { CancelledBooking } from "@prisma/client";
import { BookingCancellationDto } from "../../src/dtos/booking.dto";
import { CancelledBookingService } from "../../src/services/cancelledBooking.service";
import { generateUUID } from "../util";

describe("cancelled-BookingService unit test", () => {
  let cancelledBookingService: CancelledBookingService;

  beforeEach(() => {
    jest.clearAllMocks();
    cancelledBookingService = new CancelledBookingService();
  });

  describe("Create cancelled booking  case", () => {
    let mockTransaction: any;
    const bookingId = generateUUID();
    const reasonForCancellation = "reason for booking cancellation";

    const mockedCancelledBooking: CancelledBooking = {
      id: generateUUID(),
      bookingId,
      reason: reasonForCancellation,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    it("should create a new user", async () => {
      const cancellationDto: BookingCancellationDto = {
        bookingId,
        reason: reasonForCancellation,
      };

      // Mock transaction setup
      mockTransaction = {
        cancelledBooking: {
          create: jest.fn().mockResolvedValue(mockedCancelledBooking),
        },
      };

      // Execute createCancellationRecord
      await cancelledBookingService.createCancellationRecord(
        cancellationDto,
        mockTransaction
      );

      // Verify
      expect(mockTransaction.cancelledBooking.create).toHaveBeenCalledWith({
        data: cancellationDto,
      });
    });
  });
});
