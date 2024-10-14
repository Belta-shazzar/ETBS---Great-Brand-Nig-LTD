import { AuthService } from "@/services/auth.service";
import { Request, Response, NextFunction } from "express";
import { LoginDto, SignUpDto } from "@/dtos/auth.dto";
import { RequestWithUser } from "@/interfaces/auth.interface";

export class AuthController {
  public authService = new AuthService();

  public signUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: SignUpDto = req.body;
      const user = await this.authService.signUp(userData);

      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: LoginDto = req.body;
      const user = await this.authService.login(userData);

      res
        .status(200)
        .json(user);
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
    res.status(200).json(user);
  };
}
