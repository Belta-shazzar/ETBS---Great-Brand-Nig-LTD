import { Type } from "class-transformer";
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  MinDate,
} from "class-validator";

export class InitializeEventDto {
  @IsNotEmpty()
  @IsString()
  name: string; //name of event

  @IsNumber()
  @Min(1)
  totalTicket: number;

  @IsNotEmpty()
  @IsString()
  venue: string;

  @IsDate()
  @Type(() => Date)
  @MinDate(new Date()) //Ensure date is not before the current date
  startAt: Date;

  @IsDate()
  @Type(() => Date)
  @MinDate(new Date()) //Ensure date is not before the current date
  endAt: Date;
}
