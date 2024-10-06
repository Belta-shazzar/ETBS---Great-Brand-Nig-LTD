import "reflect-metadata";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import hpp from "hpp";
import { Routes } from "@interfaces/routes.interface";
import { CREDENTIALS, LOG_FORMAT, NODE_ENV, ORIGIN, PORT } from "@/config";
import { logger, stream } from "@/utils/logger";
import { ErrorMiddleware } from "@/middlewares/error.middleware";
import { HttpException } from "./exceptions/http.exception";
import rateLimit from "express-rate-limit";

export class App {
  public app: express.Application;
  public env: string;
  public port: string | number;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = NODE_ENV || "development";
    this.port = PORT || 3000;

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
  }

  public listen() {
    this.app.listen(this.port, () => {
      logger.info(`======= ENV: ${this.env} ========`);
      logger.info(`🚀 App listening on the port ${this.port}`);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.use(morgan(LOG_FORMAT, { stream }));
    this.app.use(cors({ origin: ORIGIN, credentials: CREDENTIALS }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next) => {
          next(new HttpException(429, `Rate limit exceeded for IP: ${req.ip}`));
        },
      })
    );
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach((route) => {
      this.app.use("/", route.router);
    });

    this.app.use((req, res, next) => {
      throw new HttpException(404, "URL not Found");
    });
  }

  private initializeErrorHandling() {
    this.app.use(ErrorMiddleware);
  }
}
