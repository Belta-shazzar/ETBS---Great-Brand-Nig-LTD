import Container from "typedi";
import { AuthService } from "@/services/auth.service";
import { Request, Response, NextFunction } from "express";
import { LoginDto, SignUpDto } from "@/dtos/auth.dto";
import { RequestWithUser } from "@/interfaces/auth.interface";

export class AuthController {
  public authService = Container.get(AuthService);

  public signUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: SignUpDto = req.body;
      const { password, ...user } = await this.authService.signUp(userData);

      res.status(201).json({ message: "Sign up successful", data: user });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: LoginDto = req.body;
      const { token, user } = await this.authService.login(userData);
      const { password, ...userDeet } = user;

      res
        .status(200)
        .json({ message: "login successful", data: userDeet, token });
    } catch (error) {
      next(error);
    }
  };

  public getAuthenticatedUser = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    const { password, ...user } = req.user;
    res.status(200).json({ message: "success", data: user });
  };
}
