import { SignUpDto } from "@/dtos/auth.dto";
import { HttpException } from "@/exceptions/http.exception";
import { PrismaClient, User } from "@prisma/client";

export class UserService {
  public user = new PrismaClient().user;

  public async createUser(signUpDto: SignUpDto): Promise<User> {
    const user = await this.user.create({
      data: signUpDto,
    });

    return user;
  }

  public async getUserByMail(email: string): Promise<User> {
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
