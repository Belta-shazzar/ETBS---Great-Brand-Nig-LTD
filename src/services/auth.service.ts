import { Service } from "typedi";
import { LoginDto, SignUpDto } from "@/dtos/auth.dto";
import { User } from "@prisma/client";
import { HttpException } from "@/exceptions/http.exception";
import { compare, hash } from "bcrypt";
import { UserService } from "@services/user.service";
import { DataStoredInToken } from "@/interfaces/auth.interface";
import { SECRET_KEY } from "@/config";
import { sign } from "jsonwebtoken";

@Service()
export class AuthService {
  public userService = new UserService();

  public async signUp(signUpDto: SignUpDto): Promise<User> {
    const checkUser: User = await this.userService.getUserByMail(
      signUpDto.email
    );
    if (checkUser)
      throw new HttpException(
        409,
        `This email ${signUpDto.email} already exists`
      );

    const hashedPassword = await hash(signUpDto.password, 10);
    const createUserData: User = await this.userService.createUser({
      ...signUpDto,
      password: hashedPassword,
    });

    return createUserData;
  }

  public async login(loginDto: LoginDto) {
    const user: User = await this.userService.getUserByMail(loginDto.email);
    if (!user)
      throw new HttpException(
        404,
        `This email ${loginDto.email} does not exist`
      );

    const isPasswordMatching: boolean = await compare(
      loginDto.password,
      user.password
    );
    if (!isPasswordMatching) throw new HttpException(401, "Incorrect password");

    const token = this.createToken(user);

    return { token, user };
  }

  public createToken(user: User): string {
    const dataStoredInToken: DataStoredInToken = { id: user.id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = 60 * 60;

    return sign(dataStoredInToken, secretKey, { expiresIn });
  }
}
