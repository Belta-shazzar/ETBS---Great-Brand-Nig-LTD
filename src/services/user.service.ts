import { PrismaClient, User } from "@prisma/client";
import { Service } from "typedi";

@Service()
export class UserService {
  public user = new PrismaClient().user;

  //   Awaiting unit test [TDD]
  public async createUser(userData: Partial<User>): Promise<User> {
    return null;
  }

  public async getUserByMail(email: string): Promise<User> {
    return this.user.findUnique({ where: { email: email } });
  }
}
