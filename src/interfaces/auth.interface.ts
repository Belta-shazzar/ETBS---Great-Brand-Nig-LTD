import { User } from "@prisma/client";
import { Request } from "express";

export interface DataStoredInToken {
  id: string;
}

export interface RequestWithUser extends Request {
  user: User;
}
