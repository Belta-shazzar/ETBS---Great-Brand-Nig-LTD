import prisma from "@/config/prisma";
import { SignUpDto } from "@/dtos/auth.dto";
import { HttpException } from "@/exceptions/http.exception";
import { User } from "@prisma/client";
import { Service } from "typedi";

@Service()
export class UserService {
  public user = prisma.user;

  public async createUser(signUpDto: SignUpDto): Promise<User> {
    const user = await this.user.create({
      data: signUpDto,
    });

    return user;
  }

  public async getUserByMail(email: string): Promise<User | null> {
    return this.user.findUnique({ where: { email: email } });
  }

  public async getUserById(userId: string): Promise<User> {
    const user = await this.user.findUnique({ where: { id: userId } });

    if (!user) throw new HttpException(404, "User does not exist");
    return user;
  }
  
  public stripUserPassword(user: User): Partial<User> {
    const { password, ...stripedUser } = user;

    return stripedUser;
  }
}
