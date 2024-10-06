import { IsNotEmpty, IsOptional, IsString } from "class-validator";
export class BookingCancellationDto {
  @IsNotEmpty()
  @IsString()
  bookingId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
