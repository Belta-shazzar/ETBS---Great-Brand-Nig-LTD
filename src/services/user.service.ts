import { PrismaClient, User } from "@prisma/client";
import { Service } from "typedi";

@Service()
export class UserService {
  public user = new PrismaClient().user;

  public async createUser(userData: Partial<User>): Promise<User> {
    let user: User = await this.getUserByMail(userData.email);

    if (!user) {
      user = await this.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
        },
      });
    }
    return user;
  }

  public async getUserByMail(email: string): Promise<User> {
    return this.user.findUnique({ where: { email: email } });
  }
}
