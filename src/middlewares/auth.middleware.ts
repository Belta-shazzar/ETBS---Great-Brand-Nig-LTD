import { PrismaClient } from "@prisma/client";
import { NextFunction, Response } from "express";
import { verify } from "jsonwebtoken";
import { DataStoredInToken, RequestWithUser } from "@interfaces/auth.interface";
import config from "@/config";
import { HttpException } from "@/exceptions/http.exception";

const getAuthorization = (req) => {
  const header = req.header("Authorization");
  if (header) return header.split("Bearer ")[1];

  return null;
};

export const AuthMiddleware = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const Authorization = getAuthorization(req);

    if (Authorization) {
      const { id } = verify(Authorization, config.app.jwtSecret) as DataStoredInToken;
      const users = new PrismaClient().user;
      const findUser = await users.findUnique({ where: { id } });

      if (findUser) {
        req.user = findUser;
        next();
      } else {
        next(new HttpException(401, "Wrong authentication token"));
      }
    } else {
      next(new HttpException(404, "Authentication token missing"));
    }
  } catch (error) {
    next(new HttpException(401, "Wrong authentication token"));
  }
};
