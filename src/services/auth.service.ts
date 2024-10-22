import { LoginDto, SignUpDto } from "@/dtos/auth.dto";
import { User } from "@prisma/client";
import { HttpException } from "@/exceptions/http.exception";
import { compare, hash } from "bcrypt";
import { UserService } from "@services/user.service";
import { AuthData, DataStoredInToken } from "@/interfaces/auth.interface";
import config from "@/config";
import { sign } from "jsonwebtoken";
import { Service } from "typedi";

@Service()
export class AuthService {
  constructor(private userService: UserService) {}

  public async signUp(signUpDto: SignUpDto): Promise<AuthData> {
    const checkUser: User = await this.userService.getUserByMail(
      signUpDto.email
    );

    if (checkUser)
      throw new HttpException(
        409,
        `This email ${signUpDto.email} already exists`
      );

    const hashedPassword = await hash(signUpDto.password, 10);
    const user: User = await this.userService.createUser({
      ...signUpDto,
      password: hashedPassword,
    });

    return {
      user: this.userService.stripUserPassword(user),
      token: this.createToken(user),
    };
  }

  public async login(loginDto: LoginDto): Promise<AuthData> {
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

    return {
      user: this.userService.stripUserPassword(user),
      token: this.createToken(user),
    };
  }

  public createToken(user: User): string {
    const dataStoredInToken: DataStoredInToken = { id: user.id };
    const secretKey: string = config.app.jwtSecret;
    const expiresIn: number = 60 * 60;

    return sign(dataStoredInToken, secretKey, { expiresIn });
  }
}
