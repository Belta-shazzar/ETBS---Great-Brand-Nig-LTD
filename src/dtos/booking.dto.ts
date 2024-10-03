import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class BookTicketDto {
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @IsNotEmpty()
  @IsString()
  name: string; //name of the booking user

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class BookingCancellationDto {
  @IsNotEmpty()
  @IsString()
  bookingId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
