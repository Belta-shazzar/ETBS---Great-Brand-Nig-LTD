import { Event } from "@prisma/client";

export interface EventStatusResponse {
  event: Partial<Event>;
  waitListCount: number;
}
