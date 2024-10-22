import { AuthController } from "@/controllers/auth.controller";
import { LoginDto, SignUpDto } from "@/dtos/auth.dto";
import { Routes } from "@/interfaces/routes.interface";
import { AuthMiddleware } from "@/middlewares/auth.middleware";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { Router } from "express";

export class AuthRoute implements Routes {
  public path: string = "/auth";
  public router: Router = Router();
  private authController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/sign-up`,
      ValidationMiddleware(SignUpDto),
      this.authController.signUp
    );
    this.router.post(
      `${this.path}/login`,
      ValidationMiddleware(LoginDto),
      this.authController.login
    );
    this.router.get(
      `${this.path}/authenticated`,
      AuthMiddleware,
      this.authController.getAuthenticatedUser
    );
  }
}
